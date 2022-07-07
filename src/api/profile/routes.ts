import express from 'express'
import { edit, login, register } from './controller'

const router = express.Router()

/**
 * @swagger
 * /profile/login:
 *   post:
 *     tags:
 *       - profile
 *     summary: Login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: object
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 */
router.post('/login', login)

/**
 * @swagger
 * /profile/register:
 *   post:
 *     tags:
 *       - profile
 *     summary: Register
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: object
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 */
router.post('/register', register)

router.post('/edit', edit)

router.post('/oauthcallback', (req, res) => {
  const { oauthToken: token } = req.body

  res.json({ token })
})

router.post('/logff', (req, res) => {
  res.json({ success: true })
})

router.post('/revoke', (req, res) => {
  res.json({ success: true })
})

export default router
