export const SettingTypes = {
  System: 'system',
  Google: 'google',
  Auth0: 'auth0',
  Internal: 'internal'
} as const
export type SettingType = typeof SettingTypes[keyof typeof SettingTypes]

export const PaymentSources = {
  Stripe: 'stripe',
  Paypal: 'paypal',
  Fake: 'fake'
} as const
export type PaymentSource = typeof PaymentSources[keyof typeof PaymentSources]

export const AuthProviders = {
  Development: 'fake',
  Firebase: 'firebase',
  Auth0: 'auth0',
  None: 'none'
} as const
export type AuthProviders = typeof AuthProviders[keyof typeof AuthProviders]

export interface SecretKeys {
  token?: string
  apiKey?: string
  clientSecret?: string
  managerSecret?: string
  webhookKey?: string
  serviceAccountJson?: string
}

export interface InternalSettings {
  startAdminEmail: string
  secretManager?: {
    enabled: boolean
    endpoint: string
    region?: string
    tokenOrKey?: string
  }
  secrets?: {
    [k in PaymentSource | SettingType]: SecretKeys
  }
}

export interface SystemSettings {
  disable: boolean
  enableStore: boolean
  enableCoins?: boolean
  authProvider?: AuthProviders
  enableShippingAddress?: boolean
  enableCookieConsent?: boolean
  enableOneTapLogin?: boolean
  enableRegistration?: boolean
  paymentMethods?: {
    stripe?: PaymentMethodSettings
    paypal?: PaymentMethodSettings
  }
}
export interface GoogleSettings {
  clientId?: string
  projectId?: string
  analyticsId?: string
  enabled?: boolean
  apiKey?: string
  databaseUrl?: string
  messagingSenderId?: string
  appId?: string
}

export interface Auth0Settings {
  clientId?: string
  tenant?: string
  clientAudience?: string
  explorerId?: string
  sync?: boolean
  enabled?: boolean
}

export interface PaymentMethodSettings {
  enabled: boolean
  subscriptionsEnabled?: boolean
  identityEnabled?: boolean
  publishableKey?: string
  clientId?: string
}

export interface Setting<T = SystemSettings | GoogleSettings | Auth0Settings | InternalSettings> {
  name: SettingType
  data: T
}
export type SettingDataType = SystemSettings & GoogleSettings & Auth0Settings & InternalSettings
export interface SettingData {
  [SettingTypes.Internal]: InternalSettings
  [SettingTypes.System]: SystemSettings
  [SettingTypes.Google]: GoogleSettings
  [SettingTypes.Auth0]: Auth0Settings
}

export type SettingState = { [k in SettingType]: SettingData[k] }

export type ClientSettings = Partial<Omit<SettingData, 'internal'>>

export interface ClientConfig {
  admin: {
    models?: string[]
  }
  ready: boolean
  settings: ClientSettings
}
