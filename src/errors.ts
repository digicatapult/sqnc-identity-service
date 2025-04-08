export class HttpError extends Error {
  public code: number
  public message: string

  constructor({ code = 500, message = 'Internal server error' }) {
    super(message)
    this.code = code
    this.message = message
  }
}

export class ServiceUnavailable extends HttpError {
  constructor() {
    super({ code: 503, message: 'Service is unavailable' })
  }
}

export class NotFound extends HttpError {
  constructor(message: string = 'Resource not found') {
    super({ code: 404, message })
  }
}

export class Conflict extends HttpError {
  constructor(message: string = 'Conflict updating resource') {
    super({ code: 409, message })
  }
}

export class BadRequest extends HttpError {
  constructor(message: string = 'Bad request') {
    super({ code: 400, message })
  }
}
