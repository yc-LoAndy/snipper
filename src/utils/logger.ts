import winston from "winston"

const Logger = winston.createLogger({
    level: "info",
    format: winston.format.json()
})

Logger.add(
    new winston.transports.Console({
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.colorize({}),
            winston.format.printf(({ level, message, timestamp }) => {
                return `${level}: ${timestamp} ${JSON.stringify(message, null, 2)}`
            })
        )
    })
)

export default Logger
