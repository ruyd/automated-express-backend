import express from 'express'
import { tokenCheckWare } from '../../shared/auth'
import { edit, forgot, login, register, social, socialCheck } from './controller'

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

router.post('/profile/logoff', (_req, res) => {
  res.json({ success: true })
})

router.post('/profile/forgot', forgot)

/**
 * @swagger
 * /profile/social:
 *  post:
 *    tags:
 *      - profile
 */
router.post('/profile/social', social)

/**
 * @swagger
 * /profile/social/check:
 *  post:
 *    tags:
 *      - profile
 */
router.post('/profile/social/check', socialCheck)

export default router
