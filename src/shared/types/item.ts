import { Entity } from '.'
import { Blab } from './blab'
import { Chapter } from './chapter'

export interface Item extends Entity {
  itemId?: string
  title?: string
  urlName?: string
  subscriptions?: string[]
  tokens?: number
  price?: number
  currency?: string
  inventory?: number
  blabs?: Blab[]
  paywall?: boolean
  tags?: string[]
  chapters?: Chapter[]
}
