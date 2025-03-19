import { ZodSchema } from "zod"
import { fromError } from "zod-validation-error"
import { NextFunction, Request, Response } from "express"

import Logger from "@/utils/logger"
import { BadRequestError } from "@/models/errors"

/* eslint-disable @typescript-eslint/no-explicit-any */
type Schemas = {
    body?: ZodSchema<any>;
    params?: ZodSchema<any>;
    query?: ZodSchema<any>;
}

export default ({ requestSchemas, responseSchema }: { requestSchemas?: Schemas, responseSchema?: ZodSchema<any> }) =>
    (req: Request, res: Response, next: NextFunction) => {
        try {
            if (requestSchemas?.body) requestSchemas.body.parse(req.body)
            if (requestSchemas?.params) requestSchemas.params.parse(req.params)
            if (requestSchemas?.query) requestSchemas.query.parse(req.query)
        }
        catch (error) {
            const validationError = fromError(error).toString().replaceAll("\"", "'")
            throw new BadRequestError(validationError)
        }

        res.validateAndSend = (body: any) => {
            if (responseSchema) {
                try {
                    body = responseSchema.parse(body)
                }
                catch (error) {
                    const validationError = fromError(error).toString()
                    Logger.error(validationError)
                    res.status(500).json({
                        error: "Response Validation Error",
                        error_description: validationError
                    })
                    return
                }
            }
            return res.send(body)
        }
        next()
    }
