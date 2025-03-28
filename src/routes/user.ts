import { z } from "zod"
import _ from "lodash"
import { Router } from "express"

import prisma from "@/utils/prisma"
import middlewares from "@/middlewares"
import { FolderStructure, FolderStructureSchema } from "@/models/folderStructure"

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
            const user = await prisma.user.findUnique({ where: { email: req.userEmail } })

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
                userName: req.userName,
                userEmail: req.userEmail,
                userAvatarUrl: user?.avatar ?? "",
                folderStructure: responseFolderStructure
            })

        }
        catch (err) {
            next(err)
        }
    }
)

export default router
