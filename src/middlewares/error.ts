import { ErrorRequestHandler } from "express"

import Logger from "@/utils/logger"
import { CustomError, InternalServerError } from "@/models/errors"

const errorMiddleware: ErrorRequestHandler = (err, req, res) => {
    Logger.error({
        req: { id: req.requestId },
        error: err instanceof Error ? err.stack : err
    })

    if (!(err instanceof CustomError)) {
        err = new InternalServerError()
    }

    const { code, message, statusCode } = err as CustomError
    res.status(statusCode).send({ code, message, requestId: req.requestId })
}

export default errorMiddleware
