# backstage

🇷🇺 [Русская версия](README_RUS.md)

A [Backstage](https://backstage.io) developer portal for the [as-platform](https://github.com/as-platform) homelab platform: a software catalog and a scaffolder, running on K3s.

> **Status: skeleton.** The repository contains only empty placeholder files. The portal itself is not implemented yet.

## Role in the platform

Backstage is the entry point of the platform flow: a developer picks a template, a language and options, and the platform creates a service repository, wires up CI/CD and security, and rolls the service out through GitOps. The whole flow is described in the [organization profile](https://github.com/as-platform).

## What is in the repository

Currently tracked in git, all as empty files:

- `app-config.yaml`
- `app-config.production.yaml`
- `Dockerfile`
- `.github/workflows/build.yml`

## Plan

- Layout: `packages/app` (frontend), `packages/backend` (backend), `plugins/`, `app-config*.yaml`, `Dockerfile`.
- The catalog reads the entities from [`k3s`](https://github.com/as-platform/k3s) (`catalog/`) and the templates from [`backstage-templates`](https://github.com/as-platform/backstage-templates) (`scaffolder/*`).
- The build workflow is not created yet.

## Related repositories

- [`backstage-templates`](https://github.com/as-platform/backstage-templates) — scaffolder templates and repository skeletons
- [`k3s`](https://github.com/as-platform/k3s) — the GitOps repository of the cluster, including the catalog files for Backstage
- [`ci-templates`](https://github.com/as-platform/ci-templates) — reusable CI workflows

## License

MIT — see [`LICENSE`](LICENSE).
