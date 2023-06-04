export interface Price {
  id: string
  amount: number
  currency: string
  interval?: string
  intervalCount?: number
  freeTrialDays?: number
  divide_by?: number
}

export interface Product {
  productId: string
  title: string
  description: string
  imageUrl?: string
  images?: string[]
  keywords?: string
  prices?: Price[]
  shippable?: boolean
}
