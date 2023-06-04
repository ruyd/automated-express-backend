export const BlabTypes = {
  Text: 'text',
  Image: 'image',
  Video: 'video',
  Audio: 'audio',
  File: 'file'
} as const

export type BlabType = typeof BlabTypes[keyof typeof BlabTypes]

export interface Blab {
  BlabId?: string
  BlabType?: BlabType
  Blab?: string
  BlabName?: string
  BlabDescription?: string
  BlabUrl?: string
  BlabSize?: number
  BlabWidth?: number
  BlabHeight?: number
  BlabDuration?: number
  BlabEncoding?: string
  BlabMimeType?: string
  BlabExtension?: string
}
