import express from 'express'
import { tokenCheckWare } from '../../shared/auth'
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
router.post('/profile/login', login)

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
router.post('/profile/register', register)

router.post('/profile/edit', tokenCheckWare, edit)

router.post('/profile/oauthcallback', (req, res) => {
  const { oauthToken: token } = req.body

  res.json({ token })
})

router.post('/profile/logoff', tokenCheckWare, (req, res) => {
  res.json({ success: true })
})

router.post('/profile/revoke', (req, res) => {
  res.json({ success: true })
})

export default router
