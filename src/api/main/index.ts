import express from 'express'
import sequelize from 'sequelize'
import { DrawingModel } from '../../shared/types'
import { list } from '../../shared/model-api/controller'

const router = express.Router()

/**
 * @swagger
 * /gallery:
 *   get:
 */
router.get('/gallery', async (req, res) => {
  const items = await list(DrawingModel, {
    where: {
      private: {
        [sequelize.Op.not]: true,
      },
    },
  })
  res.json(items)
})

export default router
