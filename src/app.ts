import helmet from "helmet"
import express from "express"
import "express-async-errors"
import cookieParser from "cookie-parser"

import router from "@/routes"
import env from "@/utils/env"
import Logger from "@/utils/logger"
import middleware from "@/middlewares"

const app = express()

app.use(helmet())
app.use(express.json())
app.use(cookieParser(env.get("COOKIE_SECRET")))
app.use(express.urlencoded({ extended: true }))

app.use(middleware.logging)
app.use("/api", router)
app.use(middleware.error)


app.listen(env.get("PORT"), () => {
    Logger.info(`Listening to port ${env.get("PORT")} in ${env.get("ENV")} environment`)
})
