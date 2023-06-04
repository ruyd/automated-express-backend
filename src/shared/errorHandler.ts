import { NextFunction, Request, Response } from 'express'
import logger from './logger'
import 'express-async-errors'

export interface HttpErrorParams {
  message?: string
  name?: string
  data?: unknown
  status?: number
  stack?: string
  code?: string
}

export class HttpError extends Error {
  data: unknown
  status: number

  /**
   * Creates an API error instance.
   * @param {string} message - The error message, defaults to: 'API Error'.
   * @param {Object} data - Error object and/or additional data.
   * @param {number} status - The HTTP status code, defaults to: '500'.
   * @param {string} stack - Error stack.
   * @param {boolean} isPublic - Whether the message should be visible to user or not.
   */
  constructor(params: HttpErrorParams = {}) {
    const { message = 'Internal server error', data, stack, status = 500 } = params
    super(message)
    this.message = message
    this.data = data
    this.status = status
    this.stack = stack
    Error.captureStackTrace(this, this.constructor)
  }
}

export class HttpNotFoundError extends HttpError {
  constructor(message = 'Not found error', data?: unknown) {
    super({
      message,
      status: 404,
      data,
    })
  }
}

export class HttpUnauthorizedError extends HttpError {
  constructor(message = 'Unauthorized: please sign in', data?: unknown) {
    super({
      message,
      status: 401,
      data,
    })
  }
}

export class HttpForbiddenError extends HttpError {
  constructor(message = 'Forbidden error', data?: unknown) {
    super({
      message,
      status: 403,
      data,
    })
  }
}

export class HttpBadRequestError extends HttpError {
  constructor(message = 'Bad request error', data?: unknown) {
    super({
      message,
      status: 400,
      data,
    })
  }
}

export function errorHandler(
  err: HttpError,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const result = {
    status: err.status || 500,
    code: err.name,
    message: err.message,
    error: err.message,
    data: err.data,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
  }

  logger.error(
    `Client with IP="${req.ip}" failed to complete request to="${req.method}" originating from="${req.originalUrl}". Status="${result.status}" Message="${err.message}"`,
    err,
  )

  if (!res.headersSent) {
    res.status(result.status)
  }

  res.json(result)

  next(err)
}
