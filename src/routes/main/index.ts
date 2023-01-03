import express from 'express'
import { gallery, sendClientConfigSettings, start } from './controller'

const router = express.Router()

router.get(['/gallery', '/gallery/:userId'], gallery)

router.get('/config', sendClientConfigSettings)

router.post('/start', start)

export default router
