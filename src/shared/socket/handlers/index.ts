import { SocketHandler } from '..'

export const userHandler: SocketHandler = (io, socket) => {
  socket.on('user:message', data => {
    console.log('user', data)
  })
}

export default [userHandler]
