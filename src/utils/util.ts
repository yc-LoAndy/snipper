import prisma from "./prisma"
import { folder } from "@prisma/client"
import * as g from "@/globalVars"
import { NotFoundError } from "@/models/errors"

export function trimAny(str: string, chars: string[]) {
    let start = 0, end = str.length;

    while (start < end && chars.indexOf(str[start]) >= 0)
        ++start;

    while (end > start && chars.indexOf(str[end - 1]) >= 0)
        --end;

    return (start > 0 || end < str.length) ? str.substring(start, end) : str;
}

export async function mkAllDir(userEmail: string, pathArr: string[]): Promise<number | null> {
    /* Assume pathArr doesn't include the file itself */
    /* Return the folder id of the last dir in pathArr */
    const rootDirsDB = await prisma.user.findUnique({
        where: { email: userEmail }, select: { folders: { include: { children: true } } }
    })
    if (!rootDirsDB)
        throw new Error(`${userEmail} not found`)
    if (pathArr.length === 0)
        return null
    const rootDirs = rootDirsDB.folders

    let rootDir = rootDirs.find(f => f.name === pathArr[0])
    if (rootDir === undefined) {
        rootDir = await prisma.folder.create({
            data: {
                name: pathArr[0],
                ownerEmail: userEmail,
                isTopLevel: true,
            },
            include: { children: true }
        })
    }

    for (let i = 1; i < pathArr.length; i++) {
        const foundDir: folder | undefined = rootDir!.children.find(f => f.name === pathArr[i])
        if (!foundDir)
            rootDir = await prisma.folder.create({
                data: {
                    name: pathArr[i],
                    ownerEmail: userEmail,
                    isTopLevel: false,
                    parrentId: rootDir!.id
                },
                include: { children: true }
            })
        else {
            const nextDir: folder & { children: folder[] } | null = await prisma.folder.findUnique({
                where: { id: foundDir.id },
                include: { children: true }
            })
            if (!nextDir)
                throw new Error()
            rootDir = nextDir
        }
    }

    return rootDir.id
}

export async function checkUserSpaceUsage(userEmail: string, newSnippetLength: number): Promise<boolean> {
    const user = await prisma.user.findUnique({ where: { email: userEmail }, select: { folders: true } })
    if (!user)
        throw new NotFoundError(`${userEmail} not found`)

    let snippetUsage = 0
    let folderUsage = 0

    async function recursiveGetStorageUsage(f: folder) {
        folderUsage++
        const completeFolder = await prisma.folder.findUnique(
            { where: { id: f.id }, select: { children: true, snippets: true } }
        )
        completeFolder!.snippets.forEach((s) => snippetUsage += s.content.length)
        for (const ch of completeFolder!.children) {
            recursiveGetStorageUsage(ch)
        }
    }

    for (const f of user.folders)
        await recursiveGetStorageUsage(f)

    return !(snippetUsage + newSnippetLength > g.MAXIMUM_SNIPPET_USAGE || folderUsage > g.MAXIMUM_FOLDER_NUM)
}
