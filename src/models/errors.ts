export class CustomError {
    public code: string
    public statusCode: number
    public message: string

    constructor(code: string, statusCode: number, message: string) {
        this.message = message
        this.code = code
        this.statusCode = statusCode
    }
}

export class InternalServerError extends CustomError {
    constructor() {
        super("0001", 500, "Internal server error")
    }
}

export class BadRequestError extends CustomError {
    constructor(message?: string) {
        super("0004", 400, message ?? "Bad Request")
    }
}

export class UnauthorizedError extends CustomError {
    constructor() {
        super("0005", 401, "Unauthorized")
    }
}

export class NotFoundError extends CustomError {
    constructor(message?: string) {
        super("0007", 404, message ?? "Not Found")
    }
}

export class ConflictError extends CustomError {
    constructor(message?: string) {
        super("0008", 409, message ?? "Conflict")
    }
}
