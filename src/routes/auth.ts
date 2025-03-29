import { z } from "zod"
import { Router } from "express"

import * as g from "@/globalVars"
import middlewares from "@/middlewares"
import prisma from "@/utils/prisma"
import tokenManager from "@/utils/token"
import { UnauthorizedError } from "@/models/errors"
import getGoogleUserData from "@/utils/oauth"

const router = Router()

/**
 * POST /logout
 *
 * Logout a user.
 */
router.post(
    "/logout",
    middlewares.validator({
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
router.post(
    "/token",
    middlewares.validator({
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

router.post(
    "/google/callback",
    middlewares.validator({
        requestSchemas: {
            body: z.object({ accessToken: z.string() })
        },
        responseSchema: z.object({ accessToken: z.string() })
    }),
    async (req, res, next) => {
        try {
            const userData = await getGoogleUserData(req.body.accessToken as string)
            const existingAccount = await prisma.user.findUnique({ where: { email: userData.email } })
            if (!existingAccount) {
                await prisma.user.create({
                    data: {
                        email: userData.email,
                        name: userData.name ?? "",
                        avatar: userData.avatar
                    }
                })
                await prisma.token.create({
                    data: {
                        userEmail: userData.email,
                        accessToken: "",
                        accessTokenExp: new Date(),
                        refreshToken: "",
                        refreshTokenExp: new Date()
                    }
                })
            }

            const accessToken = await tokenManager.setAccessToken(userData.email)
            const { refreshToken, refreshTokenExp } = await tokenManager.setRefreshToken(userData.email)
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

export default router
