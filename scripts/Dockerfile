FROM node:15.14.0-buster as builder

RUN set -x; apt update -y; apt install -y git;
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

WORKDIR /home/node/app

COPY package*.json ./

RUN npm install --loglevel verbose

COPY --chown=node:node .git                        .git                    
COPY --chown=node:node tsconfig.json               tsconfig.json
COPY --chown=node:node .babelrc                    .babelrc
COPY --chown=node:node .eslintrc.js                .eslintrc.js
COPY --chown=node:node .prettierignore             .prettierignore
COPY --chown=node:node .prettierrc                 .prettierrc
COPY --chown=node:node imgs                        imgs
COPY --chown=node:node src                         src
COPY --chown=node:node webpack.config.babel.js     webpack.config.babel.js
COPY --chown=node:node obfuscate.mjs               obfuscate.mjs          

ENV NODE_ENV release
USER node
RUN set -ex;\
    mkdir -p -v build; \
    pwd; ls -la; \
    npm run build; \
    npm run obfuscate
RUN rm --recursive --verbose .git

FROM nginx:1.18-alpine

COPY --chown=nginx:nginx --from=builder /home/node/app/build /usr/share/nginx/html/archiver-viewer
COPY ./scripts/nginx/default.conf /etc/nginx/conf.d/default.conf

