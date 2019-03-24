FROM node:8.12.0-alpine

WORKDIR /
COPY . .

RUN npm install --quiet

ENTRYPOINT [ "npm", "run-script", "build" ]