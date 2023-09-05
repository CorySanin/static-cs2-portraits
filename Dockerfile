FROM node:lts-alpine3.18 AS install

WORKDIR /usr/src/app

COPY package*.json ./

ENV NPM_CONFIG_LOGLEVEL warn
RUN npm ci --only=production

COPY . .

FROM node:lts-alpine3.18

HEALTHCHECK  --timeout=3s \
  CMD curl --fail http://localhost:8080/healthcheck || exit 1

EXPOSE 4443
EXPOSE 8080

WORKDIR /usr/src/app

RUN apk add --no-cache openssl curl && \
  chown -R node:node .

COPY --from=install /usr/src/app /usr/src/app/

USER node

CMD [ "npm", "start" ]