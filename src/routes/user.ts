import { z } from "zod"
import _ from "lodash"
import { Router } from "express"

import * as g from "@/globalVars"
import prisma from "@/utils/prisma"
import { sha256 } from "@/utils/util"
import middlewares from "@/middlewares"
import { BadRequestError, ConflictError, UnauthorizedError } from "@/models/errors"
import { FolderStructure, FolderStructureSchema } from "@/models/folderStructure"

const router = Router()


/**
 * POST /user
 *
 * Create an account.
 */
router.post(
    "/user",
    middlewares.validator({
        requestSchemas: {
            body: z.object({
                userName: z.string().optional(),
                userEmail: z.string(),
                password: z.string()
            })
        },
        responseSchema: z.object({ success: z.boolean() })
    }),
    async (req, res, next) => {
        try {
            const { userName, userEmail, password } = req.body as {
                userName?: string,
                userEmail: string,
                password: string
            }
            const existingUser = await prisma.user.findUnique({ where: { email: userEmail } })
            if (existingUser)
                return next(new ConflictError(`${userEmail} already exists.`))

            if (userName && userName.length > g.MAXIMUM_USERNAME_LEN)
                return next(new BadRequestError(`User name cannot be longer than ${g.MAXIMUM_USERNAME_LEN} characters`))
            if (password.length < g.MINIMUM_PASSWORD_LEN)
                return next(new BadRequestError(`Password length must be at least ${g.MINIMUM_PASSWORD_LEN} characters`))

            const hashedPassword = sha256(password)
            await prisma.user.create({
                data: {
                    name: userName ?? null,
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
 * Get all basic info of the user
 */
router.get(
    "/user",
    middlewares.isAuthenticated,
    middlewares.validator({
        responseSchema: z.object({
            userEmail: z.string(),
            userName: z.string().nullable(),
            folderStructure: FolderStructureSchema.array()
        })
    }),
    async (req, res, next) => {
        try {
            const rootFolders = await prisma.folder.findMany({
                where: {
                    ownerEmail: req.userEmail,
                    isTopLevel: true
                },
                include: {
                    snippets: { orderBy: { fileName: "asc" } }
                },
                orderBy: { name: "asc" }
            })

            const responseFolderStructure = [] as FolderStructure[]
            responseFolderStructure.push(...(rootFolders.map<FolderStructure>(
                (f) => ({
                    id: f.id,
                    name: f.name,
                    snippets: _.map(f.snippets, (s) => _.omit(s, "folderId")),
                    children: []
                })
            )))

            async function recursivePushStructure(f: FolderStructure) {
                const folder = await prisma.folder.findUnique({
                    where: { id: f.id },
                    select: {
                        children: {
                            include: { snippets: { orderBy: { fileName: "asc" } } }
                        },
                    }
                })
                if (!folder)
                    throw new Error()
                const children = folder.children
                children.forEach(
                    (c) => {
                        f.children.push({
                            id: c.id,
                            name: c.name,
                            snippets: _.map(c.snippets, (s) => _.omit(s, "folderId")),
                            children: []
                        })
                    }
                )

                for (const ch of f.children) {
                    await recursivePushStructure(ch)
                }
            }

            for (const root of responseFolderStructure) {
                await recursivePushStructure(root)
            }

            res.status(200).validateAndSend({
                userEmail: req.userEmail,
                userName: req.userName,
                folderStructure: responseFolderStructure
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
    middlewares.isAuthenticated,
    middlewares.validator({
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
                    return next(new UnauthorizedError())
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
