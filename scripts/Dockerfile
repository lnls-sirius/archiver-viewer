FROM node:12.19.0-stretch as builder

RUN set -x; apt update -y; apt install -y git;
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

WORKDIR /home/node/app

COPY package*.json ./

RUN npm install --loglevel verbose

COPY --chown=node:node .git              .git
COPY --chown=node:node tsconfig.json     tsconfig.json
COPY --chown=node:node .babelrc          .babelrc
COPY --chown=node:node .eslintrc.js      .eslint.js
COPY --chown=node:node .prettierignore   .prettierignore
COPY --chown=node:node .prettierrc       .prettierrc
COPY --chown=node:node imgs              imgs
COPY --chown=node:node src               src
COPY --chown=node:node webpack.config.js webpack.config.js

ENV NODE_ENV release
RUN npm run build
RUN rm --recursive --verbose .git

USER node

FROM nginx:1.18-alpine

COPY --chown=nginx:nginx --from=builder /home/node/app/build /usr/share/nginx/html/archiver-viewer
COPY ./scripts/nginx/default.conf /etc/nginx/conf.d/default.conf

