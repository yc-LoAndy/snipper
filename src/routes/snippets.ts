import { z } from "zod"
import { Router } from "express"
import convertPath from "@stdlib/utils-convert-path"

import * as g from "@/globalVars"
import prisma from "@/utils/prisma"
import middlewares from "@/middlewares"
import { BadRequestError, ConflictError, NotFoundError } from "@/models/errors"
import { trimAny, mkAllDir } from "@/utils/util"


const router = Router()

/**
 * POST /snippet
 *
 * Create a snippet for an user.
 */
router.post(
    "/snippet",
    middlewares.isAuthenticated,
    middlewares.validator({
        requestSchemas: {
            body: z.object({
                filePath: z.string(),
                content: z.string(),
            })
        },
        responseSchema: z.object({ snippetId: z.number() })
    }),
    async (req, res, next) => {
        try {
            const { filePath, content } = req.body as { filePath: string, content: string }

            const pathArray = trimAny(convertPath(filePath, "posix"), [".", "/"]).split("/")
            if (pathArray.length <= 1)
                return next(new BadRequestError("Incorrect path."))
            if (pathArray.length > g.MAXIMUM_PATH_DEPTH)
                return next(new BadRequestError(`File too deep. Maximum file depth is ${g.MAXIMUM_PATH_DEPTH+1}`))

            const fileName = pathArray[pathArray.length - 1]
            pathArray.splice(pathArray.length-1, 1)  // remove the file itself from the path
            const parentFolderId = await mkAllDir(req.userEmail, pathArray)

            const existingSnippet = await prisma.snippet.findUnique({
                where: {
                    folderId_fileName: { folderId: parentFolderId, fileName }
                }
            })
            if (existingSnippet) {
                return next(new ConflictError("Snippet already exist."))
            }
            const newSnippet = await prisma.snippet.create({
                data: {
                    content, fileName,
                    folderId: parentFolderId,
                }
            })
            return res.status(201).validateAndSend({ snippetId: newSnippet.id })
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
    middlewares.isAuthenticated,
    middlewares.validator({
        requestSchemas: {
            params: z.object({
                snippetId: z.string()
            }),
            body: z.object({
                newContent: z.string().optional(),
                newPath: z.string().optional()
            })
        },
        responseSchema: z.object({ success: z.boolean() })
    }),
    async (req, res, next) => {
        try {
            const snippetId: number = Number(req.params["snippetId"])
            const existingSnippet = await prisma.snippet.findUnique({
                where: { id: snippetId }
            })
            if (!existingSnippet)
                return next(new NotFoundError("snippet not found"))
            const { newContent, newPath } = req.body as { newContent?: string, newPath?: string }

            if (newPath) {
                const pathArray = trimAny(convertPath(newPath, "posix"), [".", "/"]).split("/")
                if (pathArray.length <= 1)
                    return next(new BadRequestError("Incorrect path. File must be in a folder."))
                const newFileName = pathArray[pathArray.length - 1]
                pathArray.splice(pathArray.length-1, 1)  // remove the file itself from the path
                const newParentFolderId = await mkAllDir(req.userEmail, pathArray)

                await prisma.snippet.update({
                    where: { id: snippetId },
                    data: {
                        folderId: newParentFolderId,
                        fileName: newFileName
                    }
                })
            }

            if (newContent)
                await prisma.snippet.update({
                    where: { id: snippetId },
                    data: { content: newContent }
                })
            res.status(200).validateAndSend({ success: true })
        }
        catch (err) {
            next(err)
        }
    }
)

/**
 * DELETE /snippet/:snippetId
 *
 * Delete a snippet.
 */
router.delete(
    "/snippet/:snippetId",
    middlewares.isAuthenticated,
    middlewares.validator({
        requestSchemas: {
            params: z.object({ snippetId: z.string() }),
        },
        responseSchema: z.object({ success: z.boolean() })
    }),
    async (req, res, next) => {
        try {
            const snippetId: number = Number(req.params['snippetId'])
            const existingSnippet = await prisma.snippet.findUnique({
                where: { id: snippetId }
            })
            if (!existingSnippet)
                return next(new ConflictError("Snippet does not exist"))
            await prisma.snippet.delete({ where: { id: snippetId } })
            res.status(200).validateAndSend({ success: true })
        }
        catch (err) {
            next(err)
        }
    }
)

/**
 * DELETE /folder/:folderId
 *
 * Delete a folde and all its contents.
 */
router.delete(
    "/folder/:folderId",
    middlewares.isAuthenticated,
    middlewares.validator({
        requestSchemas: {
            params: z.object({ folderId: z.string() }),
        },
        responseSchema: z.object({ count: z.number() })
    }),
    async (req, res, next) => {
        try {
            const folderId: number = Number(req.params['folderId'])
            const existingFolder = await prisma.folder.findUnique({
                where: { id: folderId }, include: { snippets: true }
            })
            if (!existingFolder)
                return next(new ConflictError("Folder does not exist"))

            const { count: snippetsDeleteCount } = await prisma.snippet.deleteMany({
                where: { id: { in: existingFolder.snippets.map((s) => s.id) } }
            })
            await prisma.folder.delete({
                where: { id: folderId }
            })

            res.status(200).validateAndSend({ count: snippetsDeleteCount })
        }
        catch (err) {
            next(err)
        }
    }
)

export default router
