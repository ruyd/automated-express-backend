export const SettingTypes = {
  System: 'system',
  Google: 'google',
  Auth0: 'auth0',
} as const

export type SettingType = typeof SettingTypes[keyof typeof SettingTypes]

export interface Setting<T = SystemSettings | GoogleSettings | Auth0Settings> {
  name: SettingType
  data: T
}

export interface SystemSettings {
  disable: boolean
  enableStore: boolean
  auth: 'fake' | 'auth0' | 'off'
  enableCookieConsent?: boolean
  enableOneTapLogin?: boolean
  enableRegistration?: boolean
}
export interface GoogleSettings {
  clientId?: string
  clientSecret?: string
  projectId?: string
  analyticsId?: string
  enabled?: boolean
}

export interface Auth0Settings {
  clientId?: string
  clientSecret?: string
  tenant?: string
  clientAudience?: string
  redirectUrl?: string
  explorerId?: string
  explorerSecret?: string
  sync?: boolean
  enabled?: boolean
}
export type SettingDataType = SystemSettings & GoogleSettings & Auth0Settings
export interface SettingData {
  [SettingTypes.System]: SystemSettings
  [SettingTypes.Google]: GoogleSettings
  [SettingTypes.Auth0]: Auth0Settings
}
