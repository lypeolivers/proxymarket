export default class ApiError extends Error {
  code: string
  errors: string[]
  status?: number

  constructor(message: string, code: string, errors: string[], status?: number) {
    super(message)
    this.code = code
    this.errors = errors
    this.status = status
  }
}
