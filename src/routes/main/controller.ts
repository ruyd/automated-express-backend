import express from 'express'
import sequelize from 'sequelize'
import logger from '../../shared/logger'
import { list } from '../../shared/model-api/controller'
import { DrawingModel, EnrichedRequest, SettingModel, UserModel } from '../../shared/types'
import { v4 as uuid } from 'uuid'
import { createToken } from '../../shared/auth'
import config from 'src/shared/config'
import { loadSettingsAsync, getClientConfigSettings } from 'src/shared/settings'
import { SystemSettings } from '../../shared/types'

export async function start(req: express.Request, res: express.Response) {
  logger.info(`Database Initialization by: ${req.body.email}`)
  logger.info('Creating internal settings...')
  let defaultSetting = (await SettingModel.findOne({ where: { name: 'internal' } }))?.get()
  if (defaultSetting) {
    res.status(500)
    res.json({ ok: false, error: 'Database already initialized' })
    return
  }
  let error: Error | null = null
  try {
    defaultSetting = (
      await SettingModel.create({
        name: 'internal',
        data: {
          startAdminEmail: req.body.email,
        },
      })
    ).get()
  } catch (e) {
    logger.error(e)
    error = e as Error
  }
  if (!defaultSetting) {
    res.status(500)
    res.json({ ok: false, error: error?.message })
    return
  }

  logger.info('Creating system settings...')
  const systemSetting = (
    await SettingModel.create({
      name: 'system',
      data: {
        disable: true,
      } as SystemSettings,
    })
  )?.get()
  if (!systemSetting) {
    res.status(500)
    res.json({ ok: false, error: 'Failed to create system setting' })
    return
  }

  //if statefull
  config.settings.system = systemSetting.data as SystemSettings

  let user = (await UserModel.findOne({ where: { email: req.body.email } }))?.get()
  if (!user) {
    user = (
      await UserModel.create({
        userId: uuid(),
        email: req.body.email,
        firstName: 'Admin',
      })
    ).get()
  }

  const token = createToken({
    ...user,
    roles: ['admin'],
  })

  res.json({ ok: true, token, user })
}

export async function gallery(req: express.Request, res: express.Response) {
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
}

export async function sendClientConfigSettings(req?: express.Request, res?: express.Response) {
  const user = (req as EnrichedRequest).auth
  const isAdmin = user?.roles?.includes('admin')
  await loadSettingsAsync() // stateless, add config for statefull, to skip stuff like this on VMs
  const payload = await getClientConfigSettings(isAdmin)
  res?.json(payload)
  return payload
}
