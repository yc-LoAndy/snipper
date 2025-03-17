import crypto from "crypto"
import { RequestHandler } from "express"

import Logger from "@/utils/logger"

const loggingMiddleware: RequestHandler = (req, res, next) => {
    req.requestId = crypto.randomUUID().toString()
    res.set("X-Request-ID", req.requestId)
    res.on("finish", () => {
        const log = {
            req: {
                id: req.requestId,
                ip: req.ip,
                method: req.method,
                url: req.url,
                params: req.params,
                query: req.query,
                body: req.body
            },
            res: {
                statusCode: res.statusCode
            }
        }
        const passwordProp = Object.keys(log.req.body).find(
            (key) => (
                typeof log.req.body[key] === "string"
                && key.toLowerCase().includes("password")
            )
        )
        if (passwordProp) {
            log.req.body[passwordProp] = "*".repeat(10)
        }
        Logger.info(log)
    })
    next()
}

export default loggingMiddleware
