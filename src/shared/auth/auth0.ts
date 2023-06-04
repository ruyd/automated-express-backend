import axios, { AxiosResponse } from 'axios'
import config from '../config'
import { oAuthInputs, oAuthResponse } from '../types'

export async function auth0Register(payload: oAuthInputs): Promise<oAuthResponse> {
  try {
    const response = await axios.post(`${config.auth?.baseUrl}/dbconnections/signup`, {
      connection: 'Username-Password-Authentication',
      client_id: config.auth?.clientId,
      email: payload.email,
      password: payload.password,
      user_metadata: {
        id: payload.uid,
      },
    })
    return response.data
  } catch (err) {
    const error = err as Error & { response: AxiosResponse }
    return {
      error: error.response?.data?.name ?? error.message,
      error_description: error.response?.data?.description ?? error.message,
    }
  }
}

export async function auth0Login({ email, password }: oAuthInputs): Promise<oAuthResponse> {
  try {
    const response = await axios.post(`${config.auth?.baseUrl}/oauth/token`, {
      client_id: config.auth?.clientId,
      client_secret: config.auth?.clientSecret,
      audience: `${config.auth?.baseUrl}/api/v2/`,
      grant_type: 'password',
      username: email,
      password,
    })
    return response.data
  } catch (err) {
    const error = err as Error & { response: AxiosResponse }
    return {
      error: error.response?.data?.error || error.message,
      error_description: error.response?.data?.message || error.message,
    }
  }
}
