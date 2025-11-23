# syntax=docker/dockerfile:1

FROM node:25-alpine
WORKDIR /app
# Undo the explicit install of an old yarn in node:25-alpine
RUN rm -rf /opt/yarn-v1.22.22
RUN rm -f /usr/local/bin/yarn /usr/local/bin/yarnpkg
# Install corepack (removed from node:25)
RUN npm install -g corepack
RUN corepack enable
COPY package.json yarn.lock ./
RUN yarn set version 4.11.0
#RUN yarn set version berry
#RUN yarn workspaces focus --all --production
#RUN yarn install
COPY . .
# TODO: figure out why I can't install before I copy source files over.
RUN yarn install
EXPOSE 5000
CMD ["yarn", "node", "app.js"]
