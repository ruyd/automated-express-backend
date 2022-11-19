import express from 'express'
import main from './main'
import profile from './profile'

const router = express.Router()
router.use(main)
router.use(profile)
export default router
