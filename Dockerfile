FROM node:12.19.0-stretch as builder

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

WORKDIR /home/node/app

COPY package*.json ./

RUN npm install --loglevel verbose

COPY --chown=node:node .babelrc          .babelrc
COPY --chown=node:node .browserslistrc   .browserslistrc
COPY --chown=node:node .eslintrc.json    .eslintrc.json
COPY --chown=node:node .prettierignore   .prettierignore
COPY --chown=node:node .prettierrc       .prettierrc
COPY --chown=node:node imgs              imgs
COPY --chown=node:node src               src
COPY --chown=node:node webpack.config.js webpack.config.js

USER node
ENV NODE_ENV release
RUN npm run build

FROM nginx:1.18-alpine

COPY --from=builder /home/node/app/build /usr/share/nginx/html/archiver-viewer
COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf

