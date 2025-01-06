import { StatusCode } from 'hono/utils/http-status'
import { StatusCodes } from 'http-status-codes'

export class JohanErr extends Error {
  status: StatusCode
  constructor(status: StatusCode, message: string) {
    super(message)
    this.name = 'JohanErr'
    this.status = status
  }
}

export class JohanAuthErr extends JohanErr {
  constructor(message: string = 'Unauthorized!') {
    super(StatusCodes.UNAUTHORIZED, message)
    this.name = 'JohanAuthErr'
  }
}

export class JohanNotFoundError extends JohanErr {
  constructor(message: string = 'Not found!') {
    super(StatusCodes.NOT_FOUND, message)
    this.name = 'JohanNotFoundError'
  }
}

export class JohanBadRequestErr extends JohanErr {
  constructor(message: string = 'Bad request!') {
    super(StatusCodes.BAD_REQUEST, message)
    this.name = 'JohanBadRequestErr'
  }
}
