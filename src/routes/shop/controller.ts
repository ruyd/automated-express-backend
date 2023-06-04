import { Cart, CheckoutRequest, Order, OrderStatus, Price, Product } from '../../shared/types'
import express from 'express'
import { CartModel, EnrichedRequest, SubscriptionModel } from '../../shared/types'
import { OrderItemModel, OrderModel } from '../../shared/types/models/order'
import { ProductModel } from 'src/shared/types/models/product'
import { Op } from 'sequelize'
import { createOrUpdate } from 'src/shared/model-api/controller'
import { WalletModel } from 'src/shared/types/models/wallet'

export async function getTotalCharge(userId: string) {
  const items = (await CartModel.findAll({
    where: { userId },
    include: ['drawing', 'product'],
    raw: true,
    nest: true,
  })) as unknown as Cart[]
  const subtotal = items.reduce((acc, item) => {
    const price = item.priceId
      ? item.product?.prices?.find(p => p.id === item.priceId)?.amount ?? 0
      : item.drawing?.price ?? 0
    return acc + price * item.quantity
  }, 0)
  // TODO: Add shipping and tax
  // TODO: Return metadata with tuple?
  return subtotal
}

export async function checkout(_req: express.Request, res: express.Response) {
  const req = _req as EnrichedRequest
  const { ids, intent, shippingAddressId } = req.body as CheckoutRequest
  // const listTotal = await getTotalCharge(req.auth.userId)
  const total = intent?.amount
  const order = (
    await OrderModel.create({
      userId: req.auth?.uid,
      status: OrderStatus.Pending,
      shippingAddressId,
      total,
    })
  ).get()

  const carts = (await CartModel.findAll({
    raw: true,
    include: ['drawing', 'product'],
    nest: true,
    where: {
      cartId: {
        [Op.in]: ids.map(id => id.cartId as string),
      },
    },
  })) as unknown as Cart[]

  await processCartItems(order, carts)

  if (order.OrderItems?.some(i => i.type === 'subscription')) {
    await createOrChangeSubscription(order)
  }

  let wallet = undefined
  if (order.OrderItems?.some(i => i.type === 'tokens')) {
    const creditAmount = (order.OrderItems ?? []).reduce(
      (acc, item) =>
        item.type === 'tokens' ? acc + Number(item.tokens) * Number(item.quantity) : acc,
      0,
    )
    wallet = await creditWallet(creditAmount, order.userId as string)
  }

  await CartModel.destroy({ where: { userId: req.auth.uid } })

  if (!wallet) {
    wallet = (await WalletModel.findOne({ where: { walletId: req.auth.uid } }))?.get()
  }

  res.json({ order, wallet })
}

export async function processCartItems(order: Order, carts: Cart[]) {
  order.OrderItems = []
  for (const cart of carts) {
    const { drawingId, productId, priceId, quantity, cartType } = cart
    const price = cart.product?.prices?.find(p => p.id === priceId)
    const orderItem = await OrderItemModel.create({
      orderId: order.orderId,
      type: cartType,
      drawingId,
      productId,
      priceId,
      quantity,
      paid: price?.amount ?? cart.drawing?.price ?? 0,
      tokens: cartType === 'tokens' ? price?.divide_by ?? 0 : 0,
    })
    order.OrderItems.push({ ...orderItem.get(), product: { ...cart.product, ...price } })
  }
}

export async function creditWallet(creditAmount: number, userId: string) {
  const existingWallet = (await WalletModel.findOne({ where: { walletId: userId } }))?.get()
  const existingBalance = parseFloat(existingWallet?.balance as unknown as string) || 0
  const balance = creditAmount + existingBalance
  const [item] = await WalletModel.upsert({
    walletId: userId,
    balance,
  })
  const result = item.get()
  return result
}

export async function createOrChangeSubscription(order: Order) {
  const userId = order.userId as string
  const rows = await SubscriptionModel.findAll({
    where: { userId, status: 'active' },
  })
  const existing = rows.find(
    s => order.OrderItems?.length && order.OrderItems[0].priceId === s.getDataValue('priceId'),
  )
  order.subscription = existing?.get()
  const others = rows.filter(
    s => s.getDataValue('subscriptionId') !== order.subscription?.subscriptionId,
  )
  for (const subscription of others) {
    await subscription.update({
      status: 'canceled',
      canceledAt: new Date(),
      cancelationReason: 'subscription.change',
    })
  }

  // TODO: existing, maybe renew?

  if (!order.subscription) {
    order.subscription = (
      await SubscriptionModel.create({
        subscriptionId: order.orderId,
        userId,
        orderId: order.orderId,
        priceId: order.OrderItems?.length ? order.OrderItems[0].priceId : undefined,
        status: 'active',
        title: order.OrderItems?.length ? order.OrderItems[0].product?.title : undefined,
      })
    ).get()
  }
}

export async function addSubscriptionToCart(req: express.Request, res: express.Response) {
  const { uid: userId } = (req as EnrichedRequest).auth
  const cart = { ...req.body, userId } as unknown as Cart
  const { productId, priceId } = cart
  const product = (await ProductModel.findByPk(productId, { raw: true })) as unknown as Product
  const price = product.prices?.find(p => p.id === priceId) as Price
  if (!product || !price) {
    throw new Error(`Price ${priceId} not found for product ${productId}`)
  }
  await CartModel.destroy({ where: { userId, cartType: 'subscription' } })
  const saved = await createOrUpdate(CartModel, cart)
  saved.product = { ...product, ...price }
  res.json({ ...saved })
}
