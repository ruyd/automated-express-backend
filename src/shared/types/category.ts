import { Entity, Item } from '.'

export interface Category extends Entity {
  categoryId?: string
  title?: string
  imageUrl: string
  urlName?: string
  items?: Item[]
}
