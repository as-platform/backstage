import { mockServices } from '@backstage/backend-test-utils';
import { grantRunnerGroupAccess } from './runnerAccess';

function fakeClient(groups: Array<Record<string, unknown>>) {
  const addRepoAccess = jest.fn().mockResolvedValue({});
  const getRepo = jest.fn().mockResolvedValue({ data: { id: 42 } });
  const client = {
    paginate: jest.fn().mockResolvedValue(groups),
    rest: {
      actions: {
        addRepoAccessToSelfHostedRunnerGroupInOrg: addRepoAccess,
      },
      repos: { get: getRepo },
    },
  };
  return { client: client as never, addRepoAccess, getRepo };
}

describe('grantRunnerGroupAccess', () => {
  const logger = mockServices.logger.mock();

  it('adds the repository to a group restricted to selected repositories', async () => {
    const { client, addRepoAccess } = fakeClient([
      { id: 1, name: 'Default', visibility: 'selected' },
    ]);

    const result = await grantRunnerGroupAccess({
      client,
      org: 'as-platform',
      repo: 'test',
      groupName: 'Default',
      logger,
    });

    expect(result).toBe('granted');
    expect(addRepoAccess).toHaveBeenCalledWith({
      org: 'as-platform',
      runner_group_id: 1,
      repository_id: 42,
    });
  });

  it('does nothing when the group is open to all repositories', async () => {
    const { client, addRepoAccess, getRepo } = fakeClient([
      { id: 1, name: 'Default', visibility: 'all' },
    ]);

    const result = await grantRunnerGroupAccess({
      client,
      org: 'as-platform',
      repo: 'test',
      groupName: 'Default',
      logger,
    });

    expect(result).toBe('unrestricted');
    expect(getRepo).not.toHaveBeenCalled();
    expect(addRepoAccess).not.toHaveBeenCalled();
  });

  it('fails when the group does not exist', async () => {
    const { client } = fakeClient([
      { id: 2, name: 'Other', visibility: 'selected' },
    ]);

    await expect(
      grantRunnerGroupAccess({
        client,
        org: 'as-platform',
        repo: 'test',
        groupName: 'Default',
        logger,
      }),
    ).rejects.toThrow('Runner group "Default" not found in as-platform');
  });
});
