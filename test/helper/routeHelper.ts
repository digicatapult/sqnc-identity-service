import type express from 'express'

import request from 'supertest'

const API_MAJOR_VERSION = 'v1'

interface context {
  app: express.Express
  token: string
}

export async function apiDocs({ app }: context) {
  return request(app)
    .get(`/api-docs`)
    .set('Accept', 'application/json')
    .set('Content-Type', 'application/json')
    .then((response) => {
      return response
    })
    .catch((err) => {
      console.error(`apiDocs ${err}`)
      return err
    })
}

export async function healthCheck({ app }: context) {
  return request(app)
    .get('/health')
    .set('Accept', 'application/json')
    .set('Content-Type', 'application/json')
    .then((response) => {
      return response
    })
    .catch((err) => {
      console.error(`healthCheckErr ${err}`)
      return err
    })
}

export async function getMembersRoute({ app, token }: context) {
  return request(app)
    .get(`/${API_MAJOR_VERSION}/members`)
    .set('Accept', 'application/json')
    .set('Content-Type', 'application/json')
    .set('Authorization', `Bearer ${token}`)
    .then((response) => {
      return response
    })
    .catch((err) => {
      console.error(`getMembersErr ${err}`)
      return err
    })
}

export async function getMemberByAliasOrAddressRoute({ app, token }: context, aliasOrAddress: string) {
  return request(app)
    .get(`/${API_MAJOR_VERSION}/members/${aliasOrAddress}`)
    .set('Accept', 'application/json')
    .set('Content-Type', 'application/json')
    .set('Authorization', `Bearer ${token}`)
    .then((response) => {
      return response
    })
    .catch((err) => {
      console.error(`getMembersErr ${err}`)
      return err
    })
}

export async function putMemberAliasRoute(
  { app, token }: context,
  address: string,
  { alias }: { alias: string },
  role?: string
) {
  if (!role) {
    return request(app)
      .patch(`/${API_MAJOR_VERSION}/members/${address}`)
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${token}`)
      .send({ alias })
      .then((response) => {
        return response
      })
      .catch((err) => {
        console.error(`putMemberErr ${err}`)
        return err
      })
  }
  return request(app)
    .patch(`/${API_MAJOR_VERSION}/members/${address}`)
    .set('Accept', 'application/json')
    .set('Content-Type', 'application/json')
    .set('Authorization', `Bearer ${token}`)
    .send({ alias: alias, role: role })
    .then((response) => {
      return response
    })
    .catch((err) => {
      console.error(`putMemberErr ${err}`)
      return err
    })
}

export async function getSelfAddress({ app, token }: context) {
  return request(app)
    .get(`/${API_MAJOR_VERSION}/self`)
    .set('Accept', 'application/json')
    .set('Content-Type', 'application/json')
    .set('Authorization', `Bearer ${token}`)
    .then((response) => {
      return response
    })
    .catch((err) => {
      console.error(`getSelfAddressError: ${err}`)
      return err
    })
}

export async function putRoleRoute({ app, token }: context, role: string) {
  return request(app)
    .put(`/${API_MAJOR_VERSION}/roles/${role}`)
    .set('Accept', 'application/json')
    .set('Content-Type', 'application/json')
    .set('Authorization', `Bearer ${token}`)
    .then((response) => {
      return response
    })

    .catch((err) => {
      console.error(`putRoleErr ${err}`)
      return err
    })
}

export async function getRolesRoute({ app, token }: context) {
  return request(app)
    .get(`/${API_MAJOR_VERSION}/roles`)
    .set('Accept', 'application/json')
    .set('Content-Type', 'application/json')
    .set('Authorization', `Bearer ${token}`)
    .then((response) => {
      return response
    })
    .catch((err) => {
      console.error(`getRolesErr ${err}`)
      return err
    })
}
