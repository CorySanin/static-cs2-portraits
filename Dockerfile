FROM node:lts-alpine3.18 AS install

WORKDIR /usr/src/app

COPY package*.json ./

ENV NPM_CONFIG_LOGLEVEL warn
RUN npm ci --only=production

COPY . .

FROM node:lts-alpine3.18

WORKDIR /usr/src/app

RUN apk add --no-cache openssl && \
  chown -R node:node .

COPY --from=install /usr/src/app /usr/src/app/

USER node

CMD [ "npm", "start" ]

EXPOSE 4443