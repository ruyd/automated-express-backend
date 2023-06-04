import { Blab } from './blab'

export interface Page {
  pageId?: string
  path?: string
  title?: string
  roles?: string[]
  blabs?: Blab[]
}
