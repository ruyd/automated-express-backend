import express from 'express'
import { addSubscriptionToCart, checkout } from './controller'
import { capturePaymentHandler, createOrderHandler } from './paypal'

const router = express.Router()

router.post('/shop/checkout', checkout)

router.post('/shop/subscribe', addSubscriptionToCart)

router.post('/paypal/order', createOrderHandler)

router.post('/paypal/orders/:orderID/capture', capturePaymentHandler)

export default router
