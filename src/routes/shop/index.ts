import express from 'express'
import { checkout } from './controller'

const router = express.Router()

/**
 * @swagger
 * /checkout:
 *  post:
 *   tags: [shop]
 */
router.post('/shop/checkout', checkout)

export default router
