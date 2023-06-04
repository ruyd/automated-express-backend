export interface Jwt {
  [key: string]: unknown
  iss?: string | undefined
  sub?: string | undefined
  aud?: string | string[] | undefined
  exp?: number | undefined
  nbf?: number | undefined
  iat?: number | undefined
  jti?: string | undefined
}

export interface AppAccessToken extends Jwt {
  uid: string
  roles: string[]
  memberships: string[]
  claims: {
    [key: string]: unknown
  }
}

export interface IdentityToken extends Jwt {
  picture?: string | undefined
  email: string
  name: string
  given_name: string
  family_name: string
}

export interface oAuthError {
  error?: string
  error_description?: string
  status?: number
}

export interface oAuthResponse extends oAuthError {
  access_token?: string
  id_token?: string
  scope?: string
  expires_in?: number
  token_type?: string
}

export interface oAuthRegistered extends oAuthError {
  _id?: string
  email?: string
  family_name?: string
  given_name?: string
  email_verified?: boolean
}

export type oAuthInputs = { [key: string]: string } & {
  email?: string
  password?: string
  idToken?: string
  firstName?: string
  lastName?: string
  uid?: string
}
