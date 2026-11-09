# backstage

🇷🇺 [Русская версия](README_RUS.md)

A [Backstage](https://backstage.io) developer portal for the [as-platform](https://github.com/as-platform) homelab platform: a software catalog and a scaffolder, running on K3s at `https://backstage.homelab`.

## Role in the platform

Backstage is the entry point of the platform flow: a developer picks a template and options, and the platform creates a service repository, gives it access to the self-hosted runners, registers it in the catalog and, optionally, opens a pull request that deploys it through GitOps. The whole flow is described in the [organization profile](https://github.com/as-platform).

## Status

Running in the cluster since 2026-11-09. Checked by hand on that day:

- sign-in with GitHub for the portal owner, guest sign-in is not available in production;
- the catalog loads [`k3s`](https://github.com/as-platform/k3s) (`catalog/`), the `back-go` template from [`backstage-templates`](https://github.com/as-platform/backstage-templates) and every `catalog-info.yaml` found at the root of the organization repositories;
- the `back-go` template creates a private repository, gives it access to the runner group, registers the component and, with the deploy option, opens a pull request in `k3s`.

Not checked: how the portal behaves over a longer time, the template dry run, other templates (only `back-go` exists).

## What is in the repository

- `packages/app` — the frontend: catalog, scaffolder, settings and the GitHub sign-in page.
- `packages/backend` — the backend with the `app`, `catalog` (with GitHub discovery), `scaffolder` (with GitHub actions and the custom action `github:runner-group:add-repo`), `auth` (GitHub; guest only for local development) and `permission` plugins.
- `app-config.yaml` — the base and local development configuration, `app-config.production.yaml` — the cluster configuration, every secret value comes from the environment.
- `Dockerfile` — a multi-stage build on `golden/node-builder` with the `golden/runtime:node` runtime.
- `.github/workflows/build.yml` — CI: typecheck, lint, tests, security scans, image build, signing and a tag bump in `k3s`.

## Run locally

Node.js 22 and Yarn from the repository (`.yarn/releases`) are required.

```bash
yarn install
yarn start
```

For the guest sign-in create the git-ignored `app-config.local.yaml`:

```yaml
auth:
  providers:
    guest: {}
```

Checks: `yarn tsc`, `yarn lint:all`, `yarn test:all`.

## Configuration in the cluster

The Deployment, Postgres, Ingress and the SealedSecret `backstage` live in [`k3s`](https://github.com/as-platform/k3s) (`infra/backstage`). The environment variables read by `app-config.production.yaml`:

- `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`
- `GITHUB_APP_ID`, `GITHUB_APP_CLIENT_ID`, `GITHUB_APP_CLIENT_SECRET`, `GITHUB_APP_PRIVATE_KEY`

The portal acts as a GitHub App installed on the organization. Repository permissions: Administration, Contents, Pull requests, Workflows, Variables (write) and Metadata (read); organization permission: Self-hosted runners (write).

The sign-in resolver is `userIdMatchingUserEntityAnnotation`: the `User` entity in `k3s/catalog/groups.yaml` carries the GitHub **node id** of the person in the `github.com/user-id` annotation (`gh api user --jq .node_id`), not the numeric id.

## Delivery

A push to `main` runs the workflow: the image `zot.homelab/apps/backstage:sha-<7>` is built on a self-hosted runner, scanned, pushed to Zot and signed with cosign, then the `deploy` job bumps the tag in `k3s/infra/backstage/values.yaml` and Argo CD rolls the Deployment out. The workflow runs only on `push` to `main` and `workflow_dispatch`, never on pull requests.

Repository settings the workflow needs: the variable `ZOT_REGISTRY` and the secrets `ZOT_USER`, `ZOT_PASSWORD`, `COSIGN_PRIVATE_KEY`, `COSIGN_PASSWORD`, `PLATFORM_TOKEN`.

## Updating Backstage

Run `yarn backstage-cli versions:bump`, then `yarn tsc`, the tests and `npm test` in `backstage-templates`. Renovate groups the `@backstage/**` packages. The entries of `.trivyignore` have an expiry date and must be reviewed before it.

## Related repositories

- [`backstage-templates`](https://github.com/as-platform/backstage-templates) — scaffolder templates and repository skeletons
- [`k3s`](https://github.com/as-platform/k3s) — the GitOps repository of the cluster, including the Backstage manifests and the catalog files
- [`ci-templates`](https://github.com/as-platform/ci-templates) — reusable CI workflows

## License

MIT — see [`LICENSE`](LICENSE).
