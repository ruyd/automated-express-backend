import axios from 'axios'
import winston from 'winston'
import config from './config'

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.simple(), winston.format.metadata()),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
    new winston.transports.File({ filename: '_error.log', level: 'error' }),
    new winston.transports.File({ filename: '_trace.log' }),
  ],
})

export function activateAxiosTrace() {
  axios.interceptors.request.use(req => {
    // using console to avoid sensitive data in logs
    // eslint-disable-next-line no-console
    console.log(req.method?.toUpperCase() || 'Request', req.url, config.trace ? req.data : '')
    return req
  })

  axios.interceptors.response.use(req => {
    // eslint-disable-next-line no-console
    console.log('> Response:', req.status, req.statusText, config.trace ? req.data : '')
    return req
  })
}

export default logger
