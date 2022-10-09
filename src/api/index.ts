import express from 'express'
import profile from './profile'
import main from './main'

const router = express.Router()
router.use(main)
router.use(profile)

export default router
