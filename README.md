# Sequence (SQNC) Identity Service

## Description

A `Node.js` API to support communication to the [Substrate-based](https://www.substrate.io/) [`sqnc-node`](https://github.com/digicatapult/sqnc-node) (via [`polkadot-js/api`](https://www.npmjs.com/package/@polkadot/api)) and an [`IPFS`](https://ipfs.io/) node.

## Getting started

First, ensure you're running the correct [version](.node-version) of `npm`, then install dependencies using:

```
npm install
```

Bring up dependency services (PostgreSQL, [`sqnc-node`](https://github.com/digicatapult/sqnc-node) and Keycloak) with

```
docker compose up -d
```

And run the DB migrations

```
npm run db:migrate
```

## Environment Variables

`sqnc-identity-service` is configured primarily using environment variables as follows:

| variable             | required | default                 | description                                                                                                                                           |
| -------------------- | -------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| SELF_ADDRESS         | Y        | -                       | Blockchain transacting address for this instance of Sequence                                                                                          |
| SERVICE_TYPE         | N        | `sqnc-identity-service` | Logging level. Valid values are [`trace`, `debug`, `info`, `warn`, `error`, `fatal`]                                                                  |
| PORT                 | N        | `3001`                  | The port for the API to listen on                                                                                                                     |
| API_HOST             | Y        | -                       | The hostname of the `sqnc-node` the API should connect to                                                                                             |
| API_PORT             | N        | `9944`                  | The port of the `sqnc-node` the API should connect to                                                                                                 |
| LOG_LEVEL            | N        | `info`                  | Logging level. Valid values are [`trace`, `debug`, `info`, `warn`, `error`, `fatal`]                                                                  |
| DB_HOST              | Y        | -                       | Hostname for the db                                                                                                                                   |
| DB_PORT              | N        | 5432                    | Port to connect to the db                                                                                                                             |
| DB_NAME              | N        | `sqnc`                  | Name of the database to connect to                                                                                                                    |
| DB_USERNAME          | Y        | -                       | Username to connect to the database with                                                                                                              |
| DB_PASSWORD          | Y        | -                       | Password to connect to the database with                                                                                                              |
| API_SWAGGER_BG_COLOR | N        | `#fafafa`               | CSS \_color\* val for UI bg ( try: [e4f2f3](https://coolors.co/e4f2f3) , [e7f6e6](https://coolors.co/e7f6e6) or [f8dddd](https://coolors.co/f8dddd) ) |
| API_SWAGGER_TITLE    | N        | `IdentityAPI`           | String used to customise the title of the html page                                                                                                   |
| API_SWAGGER_HEADING  | N        | `IdentityService`       | String used to customise the H2 heading                                                                                                               |
| IDP_CLIENT_ID        | Y        | -                       | OAuth2 client-id to use in swagger-ui                                                                                                                 |
| IDP_PUBLIC_ORIGIN    | Y        | -                       | Origin of IDP from outside the cluster                                                                                                                |
| IDP_INTERNAL_ORIGIN  | Y        | -                       | Origin of IDP from inside the cluster                                                                                                                 |
| IDP_OAUTH2_REALM     | Y        | -                       | Realm to use when authenticating external users                                                                                                       |
| IDP_INTERNAL_REALM   | Y        | -                       | Realm to use when authenticating cluster internal users                                                                                               |

## Running the API

Having ensured dependencies are installed and running + the relevant environment variables are set, the API can be started in production mode with

```
npm run build
```

Then

```
npm start
```

To run in a development environment it may be helpful to instead run with

```
npm run dev
```

## Running with tracing

If you would like to run in a dev mode with tracing enabled, please run:

```sh
# start dependencies with
docker-compose -f ./docker-compose.yml -f ./docker-compose.telemetry.yml up -d
# install packages
npm i
# run migrations
npm run db:migrate
# start service in dev mode with telemetry collection enabled
npm run dev:telemetry
```

Then navigate to Jaeger UI to view traces [http://localhost:16686/](http://localhost:16686/).

## API specification

The API is authenticated using the Oauth2 client-credentials flow. When using the docker-compose workflow for development a keycloak instance is deployed with a preconfigured client `sqnc-identity-service` with secret `secret`. These can be entered on the swagger ui at [http://localhost:3000/swagger](http://localhost:3000/swagger) for experimenting with the API.

### GET /members

The `address` parameter identifies the user running this process, and the `alias` representing a more friendly name version of this. The default value of the latter is null, and is optionally set.

```json
[{ "address": "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY", "alias": "ALICE" }]
```

### PUT /members/:address

The `address` parameter identifies the user running this process, and the `alias` representing a more friendly name version of this. The default value of the latter is null, and is optionally set.

```json
{ "address": "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY", "alias": "ALICE_UPDATED" }
```
