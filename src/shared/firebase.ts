import { initializeApp, cert, App } from 'firebase-admin/app'
import { getSettingsAsync } from './settings'

let firebaseApp: App | null = null
export const getFirebaseApp = async (): Promise<App> => {
  if (firebaseApp) {
    return firebaseApp
  }

  const settings = await getSettingsAsync(true)
  const serviceAccountKeyJson = settings.internal?.secrets?.google.serviceAccountJson

  if (!serviceAccountKeyJson) {
    throw new Error('To use firebase authentication you need to input your serviceAccountKey.json')
  }

  const serviceAccountObject = JSON.parse(serviceAccountKeyJson || '{}')
  const projectId = serviceAccountObject?.project_id
  const storageBucket = `${projectId}.appspot.com`
  const databaseURL = `https://${projectId}.firebaseio.com`
  const credential = serviceAccountObject ? cert(serviceAccountObject) : undefined
  firebaseApp = initializeApp({
    credential,
    databaseURL,
    storageBucket
  })
  return firebaseApp as App
}
