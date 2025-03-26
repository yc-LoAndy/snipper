import { z } from "zod"
import { Router } from "express"

import authRoute from "./auth"
import userRoute from "./user"
import snippetRoute from "./snippets"
import middlewares from "@/middlewares"

const r = Router()
// utility route to mimic internet delay
/*
import env from "@/utils/env"
r.all('*', async (_, __, next) => {
    const sleep = () => new Promise(resolve => setTimeout(resolve, 2*1000))
    if (env.get("ENV") === "dev")
        await sleep()
    next()
})
*/
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
