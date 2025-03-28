import fs from "fs/promises"
import path from "path"
import { z } from "zod"
import { Router } from "express"
import middlewares from "@/middlewares"

const router = Router()

router.get(
    "/example",
    middlewares.validator({
        responseSchema: z.object({
            name: z.string(),
            code: z.string()
        }).array()
    }),
    async (_, res, next) => {
        const samplesArr: { name: string, code: string }[] = []
        try {
            const samplesPath = path.join(__dirname, "../assets/codeSamples");
            const files = await fs.readdir(samplesPath)

            for (const file of files) {
                const filePath = path.join(samplesPath, file)
                const stats = await fs.stat(filePath)
                if (stats.isFile()) {
                    const code = await fs.readFile(filePath, "utf-8")
                    samplesArr.push({ name: file, code })
                }
            }

            res.status(200).validateAndSend(samplesArr)
        }
        catch (err) {
            next(err)
        }
    }
)

export default router
