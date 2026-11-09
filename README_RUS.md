# backstage

🇬🇧 [English version](README.md)

Портал разработчика [Backstage](https://backstage.io) для домашней платформы [as-platform](https://github.com/as-platform): каталог ПО и scaffolder, работает на K3s по адресу `https://backstage.homelab`.

## Роль в платформе

Backstage — точка входа в сценарий платформы: разработчик выбирает шаблон и опции, а платформа создаёт репозиторий сервиса, даёт ему доступ к self-hosted раннерам, регистрирует его в каталоге и, по желанию, открывает pull request, который выкатывает сервис через GitOps. Весь сценарий описан в [профиле организации](https://github.com/as-platform).

## Статус

Работает в кластере с 2026-11-09. В тот день вручную проверено:

- вход через GitHub для владельца портала, гостевой вход в production недоступен;
- каталог загружает [`k3s`](https://github.com/as-platform/k3s) (`catalog/`), шаблон `back-go` из [`backstage-templates`](https://github.com/as-platform/backstage-templates) и все `catalog-info.yaml` из корня репозиториев организации;
- шаблон `back-go` создаёт приватный репозиторий, даёт ему доступ к runner group, регистрирует компонент и, с опцией деплоя, открывает pull request в `k3s`.

Не проверено: поведение портала на длинной дистанции, dry run шаблона, другие шаблоны (есть только `back-go`).

## Что есть в репозитории

- `packages/app` — фронтенд: каталог, scaffolder, настройки и страница входа через GitHub.
- `packages/backend` — бэкенд с плагинами `app`, `catalog` (с GitHub discovery), `scaffolder` (с GitHub-действиями и своим действием `github:runner-group:add-repo`), `auth` (GitHub; guest только для локальной разработки) и `permission`.
- `app-config.yaml` — базовая и локальная конфигурация, `app-config.production.yaml` — конфигурация кластера, все секретные значения приходят из окружения.
- `Dockerfile` — многостадийная сборка на `golden/node-builder` с рантаймом `golden/runtime:node`.
- `.github/workflows/build.yml` — CI: typecheck, lint, тесты, проверки безопасности, сборка образа, подпись и бамп тега в `k3s`.

## Локальный запуск

Нужны Node.js 22 и Yarn из репозитория (`.yarn/releases`).

```bash
yarn install
yarn start
```

Для гостевого входа создай игнорируемый git файл `app-config.local.yaml`:

```yaml
auth:
  providers:
    guest: {}
```

Проверки: `yarn tsc`, `yarn lint:all`, `yarn test:all`.

## Конфигурация в кластере

Deployment, Postgres, Ingress и SealedSecret `backstage` лежат в [`k3s`](https://github.com/as-platform/k3s) (`infra/backstage`). Переменные окружения, которые читает `app-config.production.yaml`:

- `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`
- `GITHUB_APP_ID`, `GITHUB_APP_CLIENT_ID`, `GITHUB_APP_CLIENT_SECRET`, `GITHUB_APP_PRIVATE_KEY`

Портал работает как GitHub App, установленный на организацию. Права на репозитории: Administration, Contents, Pull requests, Workflows, Variables (write) и Metadata (read); право организации: Self-hosted runners (write).

Резолвер входа — `userIdMatchingUserEntityAnnotation`: у сущности `User` в `k3s/catalog/groups.yaml` в аннотации `github.com/user-id` лежит **node id** человека в GitHub (`gh api user --jq .node_id`), а не числовой id.

## Доставка

Пуш в `main` запускает workflow: образ `zot.homelab/apps/backstage:sha-<7>` собирается на self-hosted раннере, сканируется, пушится в Zot и подписывается cosign, затем job `deploy` меняет тег в `k3s/infra/backstage/values.yaml`, а Argo CD раскатывает Deployment. Workflow запускается только на `push` в `main` и `workflow_dispatch`, на pull request — никогда.

Что нужно workflow в настройках репозитория: переменная `ZOT_REGISTRY` и секреты `ZOT_USER`, `ZOT_PASSWORD`, `COSIGN_PRIVATE_KEY`, `COSIGN_PASSWORD`, `PLATFORM_TOKEN`.

## Обновление Backstage

Выполни `yarn backstage-cli versions:bump`, затем `yarn tsc`, тесты и `npm test` в `backstage-templates`. Renovate группирует пакеты `@backstage/**`. У записей `.trivyignore` есть срок действия, их нужно пересмотреть до его конца.

## Связанные репозитории

- [`backstage-templates`](https://github.com/as-platform/backstage-templates) — шаблоны scaffolder и скелеты репозиториев
- [`k3s`](https://github.com/as-platform/k3s) — GitOps-репозиторий кластера, включая манифесты Backstage и файлы каталога
- [`ci-templates`](https://github.com/as-platform/ci-templates) — переиспользуемые CI-workflow

## Лицензия

MIT — см. [`LICENSE`](LICENSE).
