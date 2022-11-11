import winston from 'winston'

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.simple(), winston.format.metadata()),
  transports: [
    new winston.transports.File({ filename: '_error.log', level: 'error' }),
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
  ],
})

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.File({ filename: '_trace.log' }))
}

export default logger
