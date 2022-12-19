import express from 'express'
import sequelize from 'sequelize'
import { DrawingModel } from '../../shared/types/models/drawing'
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
router.get('/config', async (req, res) => {
  res.json(getClientConfig())
})

export default router
