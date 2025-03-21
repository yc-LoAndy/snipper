import { z } from "zod"
import { Router } from "express"

import authRoute from "./auth"
import userRoute from "./user"
import snippetRoute from "./snippets"
import middlewares from "@/middlewares"

const r = Router()
r.use(authRoute)
r.use(userRoute)
r.use(snippetRoute)

r.get(
    "/healthcheck",
    middlewares.validator({
        responseSchema: z.object({ OK: z.boolean() })
    }),
    (_, res) => {
        res.status(200).validateAndSend({ OK: true })
    }
)

export default r
