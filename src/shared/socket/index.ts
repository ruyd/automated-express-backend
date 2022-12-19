import { Server } from 'http'
import { Server as ServerHttps } from 'https'
import { Server as SocketService, Socket } from 'socket.io'
import { decodeToken } from '../auth'
import logger from '../logger'
import { createOrUpdate } from '../model-api/controller'
import { UserActiveModel } from '../types/models/user'
import handlers from './handlers'
import { config } from '../config'

export type SocketHandler = (io: SocketService, socket: Socket) => void

export function registerSocket(server: Server | ServerHttps): void {
  const io = new SocketService(server, {
    cors: config.cors,
  })
  const onConnection = (socket: Socket) => {
    handlers.forEach((handler: SocketHandler) => handler(io, socket))

    logger.info(`⚡️[socket]: New connection: ${socket.id}`)

    socket.send('Helo', {
      config: {
        test: true,
      },
      notifications: ['Hi!'],
    })

    const decoded = decodeToken(socket.handshake.auth.token)
    logger.info('decoded' + JSON.stringify(decoded))
    createOrUpdate(UserActiveModel, {
      socketId: socket.id,
      userId: decoded?.userId,
      ip: socket.handshake.address,
      userAgent: socket.handshake.headers['user-agent'],
    })

    socket.on('disconnect', () => {
      logger.info('user disconnected' + socket.id)
      UserActiveModel.destroy({
        where: {
          socketId: socket.id,
        },
      })
    })
  }
  io.on('connection', onConnection)
}
