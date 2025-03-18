import { z } from "zod"
import { Router } from "express"

import * as g from "@/globalVars"
import prisma from "@/utils/prisma"
import middleware from "@/middlewares"
import { SupportLanguage } from "@prisma/client"
import { BadRequestError } from "@/models/errors"


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
                content: z.string()
            })
        },
        responseSchema: z.object({ snippetId: z.number() })
    }),
    async (req, res, next) => {
        try {
            const prevSnippet = await prisma.snippet.findFirst({
                where: { ownerEmail: req.userEmail },
                orderBy: { id: "desc" },
                select: { id: true }
            })
            const snippetId = prevSnippet === null ? 0 : prevSnippet.id + 1

            const { language, content } = req.body as { language: SupportLanguage, content: string }
            await prisma.snippet.create({
                data: {
                    id: snippetId,
                    ownerEmail: req.userEmail,
                    language, content
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
                newSnippet: z.string()
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
                throw new BadRequestError("snippet not found")
            const content = req.body.newSnippet as string
            await prisma.snippet.update({
                where: {
                    ownerEmail_id: {
                        ownerEmail: req.userEmail,
                        id: snippetId
                    }
                },
                data: { content }
            })
            res.status(200).validateAndSend({ success: true })
        }
        catch (err) {
            next(err)
        }
    }
)

export default router
