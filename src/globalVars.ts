import { CookieOptions } from "express"

import env from "@/utils/env"

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
export const OTP_EXP = 5 * 60 * 1000                    // 5 minutes

export const MAXIMUM_PATH_DEPTH = 4
export const MAXIMUM_SNIPPET_USAGE = 2 * 1024 * 1024 // 2 MiB
export const MAXIMUM_FOLDER_NUM = 30
export const MAXIMUM_PATH_LENGTH = 50
