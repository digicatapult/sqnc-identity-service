# syntax=docker/dockerfile:1.14
FROM node:lts-alpine as builder

WORKDIR /sqnc-identity-service

# Install base dependencies
RUN npm install -g npm@10.x.x

COPY package*.json ./
COPY tsconfig.json ./

RUN npm ci
COPY . .
RUN npm run build

# service
FROM node:lts-alpine as service

WORKDIR /sqnc-identity-service

RUN apk add --update coreutils
RUN npm -g install npm@10.x.x

COPY package*.json ./
COPY LICENSE ./
COPY knexfile.js ./
COPY migrations ./migrations

RUN npm ci --omit=dev

COPY --from=builder /sqnc-identity-service/build ./build

EXPOSE 80
CMD [ "npm", "start" ]
