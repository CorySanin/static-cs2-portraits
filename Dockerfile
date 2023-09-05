FROM node:lts-alpine3.18 AS install

WORKDIR /usr/src/app

COPY package*.json ./

ENV NPM_CONFIG_LOGLEVEL warn
RUN apk add --no-cache make g++ vips-cpp vips-dev && \
  npm install -g node-gyp
RUN npm install --build-from-source

COPY . .

FROM node:lts-alpine3.18 as deploy

HEALTHCHECK  --timeout=3s \
  CMD curl --fail http://localhost:8080/healthcheck || exit 1

EXPOSE 4443
EXPOSE 8080

WORKDIR /usr/src/app

RUN apk add --no-cache openssl vips curl && \
  chown -R node:node .

COPY --from=install /usr/src/app /usr/src/app/

USER node

CMD [ "npm", "start" ]