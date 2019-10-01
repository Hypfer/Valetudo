FROM node:lts-alpine

WORKDIR /
COPY . .

RUN yarn install --frozen-lockfile --silent

ENTRYPOINT [ "yarn", "build" ]