# backstage

🇬🇧 [English version](README.md)

Портал разработчика [Backstage](https://backstage.io) для домашней платформы [as-platform](https://github.com/as-platform): каталог ПО и scaffolder, работает на K3s.

> **Статус: каркас.** В репозитории лежат только пустые файлы-заготовки. Сам портал ещё не реализован.

## Роль в платформе

Backstage — точка входа в сценарий платформы: разработчик выбирает шаблон, язык и опции, а платформа создаёт репозиторий сервиса, подключает CI/CD и security и выкатывает сервис через GitOps. Весь сценарий описан в [профиле организации](https://github.com/as-platform).

## Что есть в репозитории

Сейчас в git отслеживаются только пустые файлы:

- `app-config.yaml`
- `app-config.production.yaml`
- `Dockerfile`
- `.github/workflows/build.yml`

## План

- Структура: `packages/app` (фронтенд), `packages/backend` (бэкенд), `plugins/`, `app-config*.yaml`, `Dockerfile`.
- Каталог читает сущности из [`k3s`](https://github.com/as-platform/k3s) (`catalog/`), а шаблоны — из [`backstage-templates`](https://github.com/as-platform/backstage-templates) (`scaffolder/*`).
- Workflow сборки ещё не создан.

## Связанные репозитории

- [`backstage-templates`](https://github.com/as-platform/backstage-templates) — шаблоны scaffolder и скелеты репозиториев
- [`k3s`](https://github.com/as-platform/k3s) — GitOps-репозиторий кластера, включая файлы каталога для Backstage
- [`ci-templates`](https://github.com/as-platform/ci-templates) — переиспользуемые CI-workflow

## Лицензия

MIT — см. [`LICENSE`](LICENSE).
