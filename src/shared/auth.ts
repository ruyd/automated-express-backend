import { expressjwt } from 'express-jwt'
import jwt from 'jsonwebtoken'
import config from './config'

const jwtVerify = expressjwt({
  secret: config.tokenSecret as string,
  algorithms: ['HS256'],
})

export function tokenCheck(_req, _res, next) {
  if (!config?.tokenSecret) {
    return next()
  }

  //_req.auth = jwt.verify(_req.headers.authorization, config.tokenSecret)

  return jwtVerify(_req, _res, next)
}

export function createToken(obj: object) {
  return jwt.sign(obj, config.tokenSecret as string, {
    expiresIn: '2d',
  })
}
