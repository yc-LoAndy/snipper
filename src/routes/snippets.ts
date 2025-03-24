import { z } from "zod"
import { Router } from "express"
import convertPath from "@stdlib/utils-convert-path"

import * as g from "@/globalVars"
import prisma from "@/utils/prisma"
import middlewares from "@/middlewares"
import { BadRequestError, ConflictError, InternalServerError, NotFoundError } from "@/models/errors"
import { trimAny, mkAllDir } from "@/utils/util"
import Logger from "@/utils/logger"


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

            let parentFolderId: number | null = null;
            const pathArray = trimAny(convertPath(filePath, "posix"), [".", "/"]).split("/")
            if (pathArray.length <= 1) {
                const account = await prisma.user.findUnique({ where: { email: req.userEmail }, select: { folders: true } })
                if (account!.folders.length !== 0)
                    return next(new BadRequestError("Incorrect path. Snippet has to be under a folder."))
                else {
                    // Create a default folder for user creating the first snippet
                    parentFolderId = (await prisma.folder.create({
                        data: {
                            name: "My Folder",
                            ownerEmail: req.userEmail,
                            isTopLevel: true,
                        }
                    })).id
                }
            }
            if (pathArray.length > g.MAXIMUM_PATH_DEPTH)
                return next(new BadRequestError(`File too deep. Maximum file depth is ${g.MAXIMUM_PATH_DEPTH+1}`))
            if (pathArray.find((f) => f.length === 0))
                return next(new BadRequestError("Incorrect path."))

            const fileName = pathArray[pathArray.length - 1]
            pathArray.splice(pathArray.length-1, 1)  // remove the file itself from the path
            if (parentFolderId === null)
                parentFolderId = await mkAllDir(req.userEmail, pathArray)

            const existingSnippet = await prisma.snippet.findUnique({
                where: {
                    folderId_fileName: { folderId: parentFolderId!, fileName }
                }
            })
            if (existingSnippet) {
                return next(new ConflictError("Snippet already exist."))
            }
            const newSnippet = await prisma.snippet.create({
                data: {
                    content, fileName,
                    folderId: parentFolderId!,
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
                if (pathArray.find((f) => f.length === 0))
                    return next(new BadRequestError("Incorrect path."))
                const newFileName = pathArray[pathArray.length - 1]
                pathArray.splice(pathArray.length-1, 1)  // remove the file itself from the path
                const newParentFolderId = await mkAllDir(req.userEmail, pathArray)

                await prisma.snippet.update({
                    where: { id: snippetId },
                    data: {
                        folderId: newParentFolderId!,
                        fileName: newFileName
                    }
                })
            }

            if (newContent !== undefined)
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
 * PUT /folder/:folderid
 *
 * Rename/relocate a folder.
 */
router.put(
    "/folder/:folderId",
    middlewares.isAuthenticated,
    middlewares.validator({
        requestSchemas: {
            params: z.object({ folderId: z.string() }),
            body: z.object({ newFolderPath: z.string() })
        },
        responseSchema: z.object({ success: z.boolean() })
    }),
    async (req, res, next) => {
        try {
            const folderId: number = Number(req.params['folderId'])
            const newFolderPath = req.body.newFolderPath as string
            const folder = await prisma.folder.findUnique({
                where: { id: folderId }
            })
            if (!folder)
                return next(new NotFoundError("Folder not found"))

            const pathArray = trimAny(convertPath(newFolderPath, "posix"), [".", "/"]).split("/")
            if (pathArray.find((f) => f.length === 0))
                return next(new BadRequestError("Incorrect path."))
            const newFolderName = pathArray[pathArray.length - 1]
            pathArray.splice(pathArray.length-1, 1)  // remove the file itself from the path
            if (pathArray.find((f) => f === folder.name))
                return next(new BadRequestError("Recursive path structure detected."))
            const newParentFolderId = await mkAllDir(req.userEmail, pathArray)
            if (newParentFolderId) {
                const parentFolder = await prisma.folder.findUnique({
                    where: { id: newParentFolderId },
                    select: { children: true }
                })
                if (parentFolder!.children.find((p) => p.name === newFolderName))
                    return next(new ConflictError("Folder already exist"))
            }
            else {
                const topFolders = await prisma.folder.findMany({
                    where: { ownerEmail: req.userEmail, isTopLevel: true },
                })
                if (topFolders === null) {
                    Logger.error("Authenticated user not found in db: ", req.userEmail)
                    return next(new InternalServerError())
                }
                if (topFolders.find((f) => f.name === newFolderName))
                    return next(new ConflictError("Folder already exist"))
            }

            await prisma.folder.update({
                where: { id: folderId },
                data: {
                    parrentId: newParentFolderId,
                    name: newFolderName,
                    isTopLevel: pathArray.length === 0
                }
            })
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
        responseSchema: z.object({ success: z.boolean() })
    }),
    async (req, res, next) => {
        try {
            const folderId: number = Number(req.params['folderId'])
            const existingFolder = await prisma.folder.findUnique({
                where: { id: folderId }, include: { snippets: true, children: true }
            })
            if (!existingFolder)
                return next(new ConflictError("Folder does not exist"))
            await prisma.folder.delete({ where: { id: folderId } })

            res.status(200).validateAndSend({ success: true })
        }
        catch (err) {
            next(err)
        }
    }
)

export default router
