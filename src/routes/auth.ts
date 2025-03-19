import { z } from "zod"
import { Router } from "express"

import * as g from "@/globalVars"
import { sha256 } from "@/utils/util"
import middleware from "@/middlewares"
import prisma from "@/utils/prisma"
import tokenManager from "@/utils/token"
import { UnauthorizedError } from "@/models/errors"

const router = Router()

/**
 * POST /login
 *
 * Authenticate a user.
 */

router.post(
    "/login",
    middleware.validator({
        requestSchemas: {
            body: z.object({
                userEmail: z.string().email(),
                userPassword: z.string(),
            })
        },
        responseSchema: z.object({ accessToken: z.string() })
    }),
    async (req, res, next) => {
        try {
            // If user is already logged-in, extends his refresh token exp
            const authHeader = req.headers.authorization
            if (authHeader) {
                const accessToken = authHeader.substring(7)
                const account = await tokenManager.verifyAccessToken(accessToken)
                if (account) {
                    const newAccessToken = await tokenManager.setAccessToken(account.userEmail)
                    const newRefreshTokenObj = await tokenManager.setRefreshToken(account.userEmail)
                    res.cookie(g.REFRESH_TOKEN_COOKIE_NAME, newRefreshTokenObj.refreshToken, {
                        ...g.COOKIE_CONFIG, expires: newRefreshTokenObj.refreshTokenExp
                    })
                    res.status(200).validateAndSend({ token: newAccessToken })
                    return next()
                }
            }

            const { userEmail, userPassword } = req.body as { userEmail: string, userPassword: string }
            const userAccount = await prisma.user.findUnique({
                where: { email: userEmail }
            })
            if (!userAccount)
                return next(new UnauthorizedError())
            if (userAccount.password !== sha256(userPassword))
                return next(new UnauthorizedError())
            const accessToken = await tokenManager.setAccessToken(userEmail)
            const { refreshToken, refreshTokenExp } = await tokenManager.setRefreshToken(userEmail)
            res.cookie(g.REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
                ...g.COOKIE_CONFIG, expires: refreshTokenExp
            })
            res.status(200).validateAndSend({ accessToken })
        }
        catch (err) {
            next(err)
        }
    }
)

/**
 * POST /logout
 *
 * Logout a user.
 */
router.post(
    "/logout",
    middleware.validator({
        responseSchema: z.object({ success: z.boolean() })
    }),
    async (req, res, next) => {
        try {
            const authHeader = req.headers.authorization
            if (authHeader) {
                const token = authHeader.substring(7)
                await tokenManager.revokeToken(token, "a")
            }
            if (req.signedCookies[g.REFRESH_TOKEN_COOKIE_NAME]) {
                await tokenManager.revokeToken(req.signedCookies[g.REFRESH_TOKEN_COOKIE_NAME], "r")
                res.clearCookie(g.REFRESH_TOKEN_COOKIE_NAME, g.COOKIE_CONFIG)
            }
            res.status(200).validateAndSend({ success: true })
            next()

        }
        catch (err) {
            next(err)
        }
    }
)

/**
 * GET /token
 *
 * Refresh the user's access token and rotate the refresh token
 */
router.get(
    "/token",
    middleware.validator({
        responseSchema: z.object({
            accessToken: z.string()
        })
    }),
    async (req, res, next) => {
        try {
            const oldRefreshToken = req.signedCookies[g.REFRESH_TOKEN_COOKIE_NAME] as string | undefined
            if (oldRefreshToken === undefined) {
                return next(new UnauthorizedError())
            }
            const rotateResult = await tokenManager.refreshAccount(oldRefreshToken)
            if (!rotateResult) {
                return next(new UnauthorizedError())
            }
            res.cookie(g.REFRESH_TOKEN_COOKIE_NAME, rotateResult.refreshToken, {
                ...g.COOKIE_CONFIG, expires: rotateResult.refreshTokenExp
            })

            res.status(200).validateAndSend({ accessToken: rotateResult.accessToken })
            next()
        }
        catch (err) {
            next(err)
        }

    }
)

export default router
