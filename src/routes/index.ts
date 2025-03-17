import { z } from "zod"
import { Router } from "express"

import authRoute from "./auth"
import middleware from "@/middlewares"

const r = Router()
r.use(authRoute)

r.get(
    "/healthcheck",
    middleware.validator({
        responseSchema: z.object({ OK: z.boolean() })
    }),
    (_, res) => {
        res.status(200).validateAndSend({ OK: true })
    }
)

export default r
