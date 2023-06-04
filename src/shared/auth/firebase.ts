import { DecodedIdToken, getAuth } from 'firebase-admin/auth'
import { getFirebaseApp } from '../firebase'
import { UserModel } from '../types/models'
import { oAuthError, oAuthInputs, oAuthRegistered, oAuthResponse } from '../types'
import { decode } from 'jsonwebtoken'
import { OAuth2Client } from 'google-auth-library'
import { getSettingsAsync } from '../settings'
import { randomUUID } from 'crypto'

export interface FirebaseAuthResponse {
  kind: string
  localId: string
  email: string
  displayName: string
  idToken: string
  registered: boolean
  refreshToken: string
  expiresIn: string
}

/**
 * Client SDK does the signin and signup calls with this idToken as a result
 * @param param0
 * @returns
 */
export const firebaseCredentialLogin = async ({ idToken }: oAuthInputs): Promise<oAuthResponse> => {
  try {
    const app = await getFirebaseApp()
    const auth = getAuth(app)
    const settings = await getSettingsAsync()
    const clientId = settings?.google?.clientId
    const projectId = settings?.google?.projectId
    const aud = (decode(idToken as string) as { aud: string })?.aud as string
    let result: DecodedIdToken
    if (aud === projectId) {
      result = await auth.verifyIdToken(idToken as string, true)
    } else {
      result = (
        await new OAuth2Client(clientId).verifyIdToken({
          idToken: idToken as string,
          audience: clientId,
        })
      ).getPayload() as DecodedIdToken
    }
    let user = (
      await UserModel.findOne({
        where: {
          email: result.email,
        },
      })
    )?.get()

    if (!user) {
      user = (
        await UserModel.create({
          email: result.email as string,
          userId: randomUUID(),
          picture: result.picture,
          firstName: result.given_name || result.display_name,
        })
      )?.get()
    }

    const access_token = await auth.createCustomToken(user.userId, {
      roles: user?.roles?.length ? user.roles : [],
    })

    return {
      access_token,
    }
  } catch (err) {
    const error = err as Error
    return {
      error: error.message,
      error_description: error.message,
    }
  }
}

export const firebaseRegister = async ({
  email,
  ...payload
}: oAuthInputs): Promise<oAuthRegistered> => {
  try {
    const app = await getFirebaseApp()
    const auth = getAuth(app)
    const result = await auth.createUser({
      ...payload,
      email,
    })

    return { ...result } as unknown as oAuthRegistered
  } catch (err) {
    const error = err as Error
    return {
      error: error.message,
    }
  }
}

export const firebaseCreateToken = async (
  uid: string,
  claims: { roles: string[] },
): Promise<string | oAuthError> => {
  try {
    const app = await getFirebaseApp()
    const auth = getAuth(app)
    const access_token = await auth.createCustomToken(uid, claims)
    return access_token
  } catch (err) {
    const error = err as Error
    return {
      error: error.message,
    }
  }
}
