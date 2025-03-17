import { RequestHandler } from "express"

import tokenManager from "@/utils/token"
import { UnauthorizedError } from "@/models/errors"

const isAuthenticated: RequestHandler = async (req, _, next) => {
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith("Bearer ")) {
        try {
            const authCode = authHeader.substring(7)
            const account = await tokenManager.verifyAccessToken(authCode)
            if (!account) {
                return next(new UnauthorizedError())
            }
            req.userEmail = account.userEmail
            req.userName = account.userName
            next()
        }
        catch (err) {
            next(err)
        }
    }
    else {
        throw new UnauthorizedError()
    }
}

export default isAuthenticated
