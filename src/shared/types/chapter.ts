import { Blab } from './blab'

export interface Chapter {
  chapterId?: string
  titleId?: number
  chapterNumber?: number
  title?: string
  chapter?: string
  blabs?: Blab[]
}
