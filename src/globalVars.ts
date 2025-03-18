import { CookieOptions } from "express"

import env from "@/utils/env"
import { SupportLanguage } from "@prisma/client"

export const COOKIE_CONFIG: CookieOptions = {
    httpOnly: true,
    secure: env.get("ENV") !== "dev",
    sameSite: "strict",
    path: "/",
    signed: true
}

export const REFRESH_TOKEN_COOKIE_NAME = "refresh_token_"
export const REFRESH_TOKEN_EXP = 8 * 60 * 60 * 1000     // 8 hours
export const ACCESS_TOKEN_EXP = 10 * 60 * 1000          // 10 minutes

export const MINIMUM_PASSWORD_LEN = 8

export const SUPPORTED_LANGUAGES = Object.values(SupportLanguage)
