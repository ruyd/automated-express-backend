import express from 'express'
import sequelize from 'sequelize'
import { DrawingModel, EnrichedRequest } from '../../shared/types'
import { list } from '../../shared/model-api/controller'
import { getClientConfig } from '../../shared/config'

const router = express.Router()

/**
 * @swagger
 * /gallery:
 *  get:
 */
router.get(['/gallery', '/gallery/:userId'], async (req, res) => {
  const conditional = req.params.userId ? { userId: req.params.userId } : {}
  const items = await list(DrawingModel, {
    where: {
      ...conditional,
      private: {
        [sequelize.Op.not]: true,
      },
    },
  })
  res.json(items)
})

/**
 * @swagger
 * /config:
 *  get:
 */
router.get('/config', async (_req, res) => {
  const req = _req as EnrichedRequest
  res.json(getClientConfig(req.auth))
})

export default router
