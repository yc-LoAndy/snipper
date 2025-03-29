import { z } from "zod"
import { Router } from "express"

import prisma from "@/utils/prisma"
import middlewares from "@/middlewares"
import { FolderStructureSchema } from "@/models/folderStructure"

const router = Router()


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
            userName: z.string().nullable(),
            userEmail: z.string(),
            userAvatarUrl: z.string(),
            folderStructure: FolderStructureSchema.array()
        })
    }),
    async (req, res, next) => {
        try {
            const user = await prisma.user.findUnique({
                where: { email: req.userEmail },
                select: { avatar: true }
            })

            const folderStructure = await prisma.folder.findMany({
                where: { ownerEmail: req.userEmail, isTopLevel: true },
                select: {
                    id: true,
                    name: true,
                    snippets: { omit: { folderId: true } },
                    children: {
                        select: {
                            id: true,
                            name: true,
                            snippets: { omit: { folderId: true } },
                            children: {
                                select: {
                                    id: true,
                                    name: true,
                                    snippets: { omit: { folderId: true } },
                                    children: {  // Fetching up to 3 levels deep
                                        select: {
                                            id: true,
                                            name: true,
                                            snippets: { omit: { folderId: true } }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                orderBy: { name: "asc" }
            })

            res.status(200).validateAndSend({
                userName: req.userName,
                userEmail: req.userEmail,
                userAvatarUrl: user?.avatar ?? "",
                folderStructure: folderStructure
            })

        }
        catch (err) {
            next(err)
        }
    }
)

export default router
