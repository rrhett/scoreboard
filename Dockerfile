# syntax=docker/dockerfile:1

FROM rrhett/node:25-alpine3.22-yarnmodern
WORKDIR /app
COPY package.json yarn.lock ./
COPY . .
# TODO: figure out why I can't install before I copy source files over.
RUN yarn install
EXPOSE 5000
CMD ["yarn", "node", "app.js"]
