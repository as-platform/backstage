import {
  coreServices,
  createBackendModule,
  LoggerService,
} from '@backstage/backend-plugin-api';
import { InputError } from '@backstage/errors';
import {
  DefaultGithubCredentialsProvider,
  GithubCredentialsProvider,
  ScmIntegrationRegistry,
  ScmIntegrations,
} from '@backstage/integration';
import {
  createTemplateAction,
  parseRepoUrl,
  scaffolderActionsExtensionPoint,
} from '@backstage/plugin-scaffolder-node';
import {
  getOctokitClient,
  getOctokitOptions,
} from '@backstage/plugin-scaffolder-backend-module-github';

type GithubClient = ReturnType<typeof getOctokitClient>;

export async function grantRunnerGroupAccess(options: {
  client: GithubClient;
  org: string;
  repo: string;
  groupName: string;
  logger: LoggerService;
}): Promise<'granted' | 'unrestricted'> {
  const { client, org, repo, groupName, logger } = options;

  const groups = await client.paginate(
    'GET /orgs/{org}/actions/runner-groups',
    {
      org,
      per_page: 100,
    },
  );
  const group = groups.find(candidate => candidate.name === groupName);
  if (!group) {
    throw new InputError(`Runner group "${groupName}" not found in ${org}`);
  }
  if (group.visibility !== 'selected') {
    logger.info(
      `Runner group "${groupName}" is open to ${group.visibility} repositories, nothing to grant`,
    );
    return 'unrestricted';
  }

  const { data } = await client.rest.repos.get({ owner: org, repo });
  await client.rest.actions.addRepoAccessToSelfHostedRunnerGroupInOrg({
    org,
    runner_group_id: group.id,
    repository_id: data.id,
  });
  logger.info(`Granted ${org}/${repo} access to runner group "${groupName}"`);
  return 'granted';
}

function createRunnerGroupAddRepoAction(options: {
  integrations: ScmIntegrationRegistry;
  githubCredentialsProvider: GithubCredentialsProvider;
}) {
  const { integrations, githubCredentialsProvider } = options;

  return createTemplateAction({
    id: 'github:runner-group:add-repo',
    description:
      'Gives a repository access to a self-hosted runner group of its organization.',
    schema: {
      input: {
        repoUrl: z =>
          z.string({
            description:
              'Accepts the format `github.com?repo=reponame&owner=owner`',
          }),
        runnerGroup: z =>
          z
            .string({ description: 'Runner group name, defaults to Default' })
            .optional(),
      },
    },
    async handler(ctx) {
      const { repoUrl, runnerGroup } = ctx.input;
      const { host, owner, repo } = parseRepoUrl(repoUrl, integrations);
      if (!owner) {
        throw new InputError('Invalid repository owner provided in repoUrl');
      }

      const octokitOptions = await getOctokitOptions({
        integrations,
        credentialsProvider: githubCredentialsProvider,
        host,
        owner,
        repo,
      });
      const client = getOctokitClient(octokitOptions, ctx.logger);

      await ctx.checkpoint({
        key: `github.runner-group.add-repo.${owner}.${repo}`,
        fn: async () => {
          await grantRunnerGroupAccess({
            client,
            org: owner,
            repo,
            groupName: runnerGroup ?? 'Default',
            logger: ctx.logger,
          });
        },
      });
    },
  });
}

export default createBackendModule({
  pluginId: 'scaffolder',
  moduleId: 'runner-access',
  register(env) {
    env.registerInit({
      deps: {
        scaffolder: scaffolderActionsExtensionPoint,
        config: coreServices.rootConfig,
      },
      async init({ scaffolder, config }) {
        const integrations = ScmIntegrations.fromConfig(config);
        scaffolder.addActions(
          createRunnerGroupAddRepoAction({
            integrations,
            githubCredentialsProvider:
              DefaultGithubCredentialsProvider.fromIntegrations(integrations),
          }),
        );
      },
    });
  },
});
