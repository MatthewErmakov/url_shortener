FROM node:24-bookworm-slim

WORKDIR /usr/src/app

ENV NODE_ENV=development

RUN apt-get update && apt-get install -y psmisc \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable

COPY package.json yarn.lock ./

RUN yarn install --immutable || yarn install

COPY . .

EXPOSE 4004

CMD ["sh", "-c", "yarn nest build analytics; node dist/apps/analytics/main"]
