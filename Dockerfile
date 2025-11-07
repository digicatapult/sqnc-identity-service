# syntax=docker/dockerfile:1.19
FROM node:24-alpine AS builder

WORKDIR /sqnc-identity-service

COPY package*.json ./

RUN npm ci
COPY . .
RUN npm run build

# service
FROM node:24-alpine AS service

WORKDIR /sqnc-identity-service

RUN apk add --update coreutils

COPY package*.json ./
COPY LICENSE ./
COPY knexfile.js ./
COPY migrations ./migrations

RUN npm ci --omit=dev

COPY --from=builder /sqnc-identity-service/build ./build

EXPOSE 80
CMD [ "npm", "start" ]
