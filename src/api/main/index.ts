import express from 'express'
import sequelize from 'sequelize'
import { DrawingModel } from '../../types'
import { list } from '../_auto/controller'

/**
 *  No subprefix, directly to /api
 */
const router = express.Router()

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
