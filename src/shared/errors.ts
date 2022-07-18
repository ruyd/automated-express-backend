import httpStatus from 'http-status'
import { NextFunction, Request, Response } from 'express'

export interface HttpErrorParams {
  message?: string
  name?: string
  data?: unknown
  status?: number
  stack?: string
  isPublic?: boolean
}

/**
 * Re-usable HttpError class.
 */
export class HttpError extends Error {
  data: unknown
  status: number
  isPublic: boolean

  /**
   * Creates an API error instance.
   * @param {string} message - The error message, defaults to: 'API Error'.
   * @param {string} name - The name of the error: 'API_ERROR'.
   * @param {Object} data - Error object and/or additional data.
   * @param {number} status - The HTTP status code, defaults to: '500'.
   * @param {string} stack - Error stack.
   * @param {boolean} isPublic - Whether the message should be visible to user or not.
   */
  constructor(params: HttpErrorParams = {}) {
    const {
      message = 'API error',
      name = 'API_ERROR',
      data,
      stack,
      status = httpStatus.INTERNAL_SERVER_ERROR,
      isPublic = false,
    } = params
    super(message)
    this.name = name
    this.message = message
    this.data = data
    this.status = status
    this.isPublic = isPublic
    this.stack = stack
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * This Bad Request error indicates that the server cannot or will not process
 * the request due to something that is perceived to be a client error
 * (e.g., malformed request syntax, invalid request message framing, or
 * deceptive request routing).
 *
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/400
 * @export class HttpBadRequestError
 * @extends {HttpError}
 */
export class HttpBadRequestError extends HttpError {
  constructor(message = 'Bad request error', data?: unknown) {
    super({
      message,
      name: httpStatus['400_NAME'],
      status: httpStatus.BAD_REQUEST,
      isPublic: true,
      data,
    })
  }
}

/**
 * The HTTP 401 Unauthorized client error status response code indicates that
 * the request has not been applied because it lacks valid authentication
 * credentials for the target resource.
 * This status is similar to 403, but in this case, authentication is possible.
 *
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/401
 * @export class HttpUnauthorizedError
 * @extends {HttpError}
 */
export class HttpUnauthorizedError extends HttpError {
  constructor(message = 'Unauthorized error', data?: unknown) {
    super({
      message,
      name: httpStatus['401_NAME'],
      status: httpStatus.UNAUTHORIZED,
      isPublic: true,
      data,
    })
  }
}

/**
 * The HTTP 403 Forbidden client error status response code indicates that
 * the server understood the request but refuses to authorize it.
 * This status is similar to 401, but in this case, re-authenticating
 * will make no difference. The access is permanently forbidden and tied to
 * the application logic, such as insufficient rights to a resource.
 *
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/403
 * @export class HttpForbiddenError
 * @extends {HttpError}
 */
export class HttpForbiddenError extends HttpError {
  constructor(message = 'Forbidden error', data?: unknown) {
    super({
      message,
      name: httpStatus['403_NAME'],
      status: httpStatus.FORBIDDEN,
      isPublic: true,
      data,
    })
  }
}

/**
 * The HTTP 404 Not Found client error response code indicates that the server can't
 * find the requested resource. Links that lead to a 404 page are often called broken
 * or dead links and can be subject to link rot.
 *
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/400
 * @export class HttpBadRequestError
 * @extends {HttpError}
 */
export class HttpNotFoundError extends HttpError {
  constructor(message = 'Not found error', data?: unknown) {
    super({
      message,
      name: httpStatus['404_NAME'],
      status: httpStatus.NOT_FOUND,
      isPublic: true,
      data,
    })
  }
}

/**
 * The HTTP 409 Conflict response status code indicates a request conflict with current
 *  state of the target resource. Conflicts are most likely to occur in response to a PUT
 * request. For example, you may get a 409 response when uploading a file which is older
 * than the one already on the server resulting in a version control conflict.
 *
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/409
 * @export class HttpBadRequestError
 * @extends {HttpError}
 */
export class HttpConflictError extends HttpError {
  constructor(message = 'Conflict error', data?: unknown) {
    super({
      message,
      name: httpStatus['409_NAME'],
      status: httpStatus.CONFLICT,
      isPublic: true,
      data,
    })
  }
}

/**
 * The Internal Server Error server error response code indicates that the server
 * encountered an unexpected condition that prevented it from fulfilling the request.
 *
 * This error response is a generic "catch-all" response. Usually, this indicates the
 * server cannot find a better 5xx error code to response. Sometimes, server administrators
 * log error responses like the 500 status code with more details about the request to
 * prevent the error from happening again in the future.
 *
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/400
 * @export class HttpBadRequestError
 * @extends {HttpError}
 */
export class HttpInternalServerError extends HttpError {
  constructor(message = 'Internal server error', data?: unknown) {
    super({
      message,
      name: httpStatus['500_NAME'],
      status: httpStatus.INTERNAL_SERVER_ERROR,
      data,
    })
  }
}

type HttpErrorResponse = Required<
  Pick<HttpErrorParams, 'status' | 'message'> & { code: string }
> &
  Pick<HttpErrorParams, 'data' | 'stack'>

/**
 * Handler for all requests that throw an Error.
 *
 * Inspired by:
 * - https://dev.to/lvidakovic/handling-custom-error-types-in-express-js-1k90
 * - https://github.com/danielfsousa/express-rest-boilerplate/
 */
export function errorHandler(
  err: HttpError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const response: HttpErrorResponse = {
    status: err.status || httpStatus.INTERNAL_SERVER_ERROR,
    code: err.name,
    message: err.message,
    data: err.data,
    stack: err.stack,
  }

  console.error(
    `Client with IP="${req.ip}" failed to complete request to="${req.method}" originating from="${req.originalUrl}". Status="${response.status}" Message="${err.message}"`,
    err
  )

  res.status(response.status)
  res.json(response)
}
