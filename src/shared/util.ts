import { validate, v4 } from 'uuid'

export function dashifyUUID(i: string): string {
  return (
    i.substring(0, 8) +
    '-' +
    i.substring(8, 4) +
    '-' +
    i.substring(12, 4) +
    '-' +
    i.substring(16, 4) +
    '-' +
    i.substring(20)
  )
}

export function tryDashesOrNewUUID(undashed?: string): string {
  if (undashed) {
    const candidate = dashifyUUID(undashed)
    if (validate(candidate)) {
      return candidate
    }
  }
  return v4()
}

export function getPictureMock(payload: Record<string, string>): string {
  let f = '?'
  let l = ''
  if (!payload?.picture && payload.firstName && payload.lastName) {
    f = payload.firstName.charAt(0).toLowerCase()
    l = payload.lastName.charAt(0).toLowerCase()
  }
  return `https://i2.wp.com/cdn.auth0.com/avatars/${f}${l}.png?ssl=1`
}

export const hello = 'xxxx'
