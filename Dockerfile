FROM zot.homelab/golden/node-builder:stable AS packages
COPY --chown=node:node backstage.json package.json yarn.lock .yarnrc.yml /home/node/app/
COPY --chown=node:node .yarn/releases /home/node/app/.yarn/releases
COPY --chown=node:node packages /home/node/app/packages
WORKDIR /home/node/app
RUN find packages \! -name "package.json" -mindepth 2 -maxdepth 2 -exec rm -rf {} \+

FROM zot.homelab/golden/node-builder:stable AS build
ENV NODE_OPTIONS=--max-old-space-size=1536
COPY --from=packages --chown=node:node /home/node/app/ /home/node/app/
WORKDIR /home/node/app
RUN yarn install --immutable
COPY --chown=node:node . .
RUN yarn --cwd packages/backend build
RUN mkdir packages/backend/dist/skeleton packages/backend/dist/bundle \
 && tar xzf packages/backend/dist/skeleton.tar.gz -C packages/backend/dist/skeleton \
 && tar xzf packages/backend/dist/bundle.tar.gz -C packages/backend/dist/bundle

FROM zot.homelab/golden/node-builder:stable AS deps
COPY --from=build --chown=node:node /home/node/app/.yarn/releases /home/node/app/.yarn/releases
COPY --from=build --chown=node:node /home/node/app/.yarnrc.yml /home/node/app/backstage.json /home/node/app/
COPY --from=build --chown=node:node /home/node/app/yarn.lock /home/node/app/package.json /home/node/app/packages/backend/dist/skeleton/ /home/node/app/
WORKDIR /home/node/app
RUN yarn workspaces focus --all --production
COPY --from=build --chown=node:node /home/node/app/packages/backend/dist/bundle/ /home/node/app/

FROM zot.homelab/golden/runtime:node
LABEL org.opencontainers.image.source="https://github.com/as-platform/backstage"
WORKDIR /app
COPY --from=deps /home/node/app/ /app/
COPY app-config.yaml app-config.production.yaml /app/
ENV NODE_ENV=production
USER 65532:65532
EXPOSE 7007
CMD ["packages/backend", "--config", "app-config.yaml", "--config", "app-config.production.yaml"]
