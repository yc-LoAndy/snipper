import { z } from "zod"
import { Router } from "express"

import * as g from "@/globalVars"
import prisma from "@/utils/prisma"
import { sha256 } from "@/utils/util"
import middleware from "@/middlewares"
import { BadRequestError, ConflictError, UnauthorizedError } from "@/models/errors"
import { SupportLanguage } from "@prisma/client"

const router = Router()


/**
 * POST /user
 *
 * Create an account.
 */
router.post(
    "/user",
    middleware.validator({
        requestSchemas: {
            body: z.object({
                userEmail: z.string(),
                password: z.string()
            })
        },
        responseSchema: z.object({ success: z.boolean() })
    }),
    async (req, res, next) => {
        try {
            const { userEmail, password } = req.body as { userEmail: string, password: string }
            const existingUser = await prisma.user.findUnique({ where: { email: userEmail } })
            if (existingUser)
                throw new ConflictError(`${userEmail} already exists.`)

            if (password.length < g.MINIMUM_PASSWORD_LEN)
                throw new BadRequestError("Password length must be at least 8 characters")

            const hashedPassword = sha256(password)
            await prisma.user.create({
                data: {
                    email: userEmail,
                    password: hashedPassword,
                    tokens: {
                        create: {
                            accessToken: "",
                            refreshToken: "",
                            // dummy tokens that expires immediately
                            accessTokenExp: new Date(),
                            refreshTokenExp: new Date()
                        }
                    }
                }
            })
            res.status(201).validateAndSend({ success: true })
        }
        catch (err) {
            next(err)
        }
    }
)

/**
 * GET /user
 *
 * Get basic info of the user
 */
router.get(
    "/user",
    middleware.isAuthenticated,
    middleware.validator({
        responseSchema: z.object({
            userEmail: z.string(),
            userName: z.string().nullable(),
            snippets: z.array(
                z.object({
                    laguage: z.nativeEnum(SupportLanguage),
                    content: z.string()
                }).nullable()
            )
        })
    }),
    async (req, res, next) => {
        try {
            const snippetsResult = await prisma.snippet.findMany({
                where: { ownerEmail: req.userEmail }
            })
            const snippets = snippetsResult.map(
                (s) => ({ language: s.language, content: s.content })
            )
            res.status(200).validateAndSend({
                userEmail: req.userEmail,
                userName: req.userName,
                snippets
            })
        }
        catch (err) {
            next(err)
        }
    }
)

/**
 * PATCH /user
 *
 * Modify user's password or user name
 */
router.patch(
    "/user",
    middleware.isAuthenticated,
    middleware.validator({
        requestSchemas: {
            body: z.object({
                oldPassword: z.string().optional(),
                newPassword: z.string().optional(),
                newUserName: z.string().optional()
            })
        },
        responseSchema: z.object({ success: z.boolean() })
    }),
    async (req, res, next) => {
        try {
            const { oldPassword, newPassword, newUserName } = req.body as {
                oldPassword?: string
                newPassword?: string
                newUserName?: string
            }
            const userAccount = await prisma.user.findUnique({ where: { email: req.userEmail } })
            if (newPassword) {
                if (!oldPassword || sha256(oldPassword) !== userAccount!.password)
                    throw new UnauthorizedError()
            }
            if (newUserName) {
                await prisma.user.update({
                    where: { email: req.userEmail },
                    data: { name: newUserName }
                })
            }
            res.status(200).validateAndSend({ success: true })
        }
        catch (err) {
            next(err)
        }
    }
)

export default router
