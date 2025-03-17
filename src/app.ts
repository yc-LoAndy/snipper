import helmet from "helmet"
import express, { Router } from "express"
import "express-async-errors"

import env from "@/utils/env"
import Logger from "@/utils/logger"

const app = express()
const router = Router()

app.use(helmet())
app.use(express.json())
app.use(router)

app.listen(env.get("PORT"), () => {
    Logger.info(`Listening to port ${env.get("PORT")} in ${env.get("ENV")} environment`)
})
