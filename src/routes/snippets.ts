import { z } from "zod"
import { Router } from "express"

import * as g from "@/globalVars"
import prisma from "@/utils/prisma"
import middleware from "@/middlewares"
import { SupportLanguage } from "@prisma/client"
import { BadRequestError, ConflictError } from "@/models/errors"


const router = Router()

/**
 * GET /supported-language
 *
 * Get the list of all support programming languages.
 */
router.get(
    "/snippet/supported-language",
    middleware.validator({
        responseSchema: z.array(z.object({
            language: z.nativeEnum(SupportLanguage),
            imagePath: z.string()
        }))
    }),
    async (req, res, next) => {
        try {
            const response = g.SUPPORTED_LANGUAGES.map(
                (l) => ({
                    language: l,
                    imagePath: `./src/assets/${l.toLowerCase()}.png`
                })
            )
            res.status(200).validateAndSend(response)
        }
        catch (err) {
            next(err)
        }
    }
)

/**
 * POST /snippet
 *
 * Create an snippet for an user.
 */
router.post(
    "/snippet",
    middleware.isAuthenticated,
    middleware.validator({
        requestSchemas: {
            body: z.object({
                language: z.nativeEnum(SupportLanguage),
                fileName: z.string(),
                folderName: z.string(),
                content: z.string(),
            })
        },
        responseSchema: z.object({ snippetId: z.number() })
    }),
    async (req, res, next) => {
        try {
            const {
                language,
                fileName,
                folderName,
                content
            } = req.body as { language: SupportLanguage, fileName: string, folderName: string, content: string }
            const ext = g.LANGUAGE_EXTENSIONS.get(language)
            const dupSnippet = await prisma.snippet.findUnique({
                where: { language, fileName_folderName: { fileName, folderName }}
            })
            if (dupSnippet)
                return next(new ConflictError(`${folderName}/${fileName}.${ext} already exists. Give a different name.`))

            const prevSnippet = await prisma.snippet.findFirst({
                where: { ownerEmail: req.userEmail },
                orderBy: { id: "desc" },
                select: { id: true }
            })
            const snippetId = prevSnippet === null ? 0 : prevSnippet.id + 1

            await prisma.snippet.create({
                data: {
                    id: snippetId,
                    ownerEmail: req.userEmail,
                    language, content, fileName, folderName
                }
            })
            res.status(201).validateAndSend({ snippetId })
        }
        catch (err) {
            next(err)
        }
    }
)

/**
 * PUT /snippet/:snippetid
 *
 * Modify the snippet content of an user.
 */
router.put(
    "/snippet/:snippetId",
    middleware.isAuthenticated,
    middleware.validator({
        requestSchemas: {
            params: z.object({
                snippetId: z.number()
            }),
            body: z.object({
                newSnippet: z.string().optional(),
                newFolder: z.string().optional(),
                newFileName: z.string().optional()
            })
        },
        responseSchema: z.object({ success: z.boolean() })
    }),
    async (req, res, next) => {
        try {
            const snippetId: number = Number(req.params["snippetId"])
            const snippetRecord = await prisma.snippet.findUnique({
                where: {
                    ownerEmail_id: {
                        ownerEmail: req.userEmail,
                        id: snippetId
                    }
                }
            })
            if (!snippetRecord)
                return next(new BadRequestError("snippet not found"))
            const { newSnippet, newFolder, newFileName } = req.body as {
                newSnippet?: string, newFolder?: string, newFileName?: string
            }
            const data = Object.fromEntries(
                Object.entries({ newSnippet, newFolder, newFileName }).filter(
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    ([ _, v ]) => v !== undefined
                )
            )
            if (Object.keys(data).length !== 0) {
                await prisma.snippet.update({
                    where: {
                        ownerEmail_id: {
                            ownerEmail: req.userEmail,
                            id: snippetId
                        }
                    },
                    data
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
