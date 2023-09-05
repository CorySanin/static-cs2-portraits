FROM node:lts-alpine3.18 AS install

WORKDIR /usr/src/app

COPY package*.json ./

ENV NPM_CONFIG_LOGLEVEL warn
RUN apk add --no-cache make g++ && \
  apk add --no-cache vips-cpp vips-dev --repository https://dl-cdn.alpinelinux.org/alpine/edge/community/ && \
  npm install -g node-gyp
RUN npm ci --only=production || npm ci --only=production --build-from-source

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