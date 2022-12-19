import express from 'express'
import main from './main'
import profile from './profile'
import shop from './shop'

const router = express.Router()
router.use(main)
router.use(profile)
router.use(shop)
export default router
