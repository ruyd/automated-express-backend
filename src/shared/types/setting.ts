export enum SettingType {
  System = 'system',
  Provider = 'provider',
  Plugin = 'plugin',
}

export interface Setting {
  name: string
  type?: SettingType
  data?: { [key: string]: unknown }
  enabled?: boolean
}
