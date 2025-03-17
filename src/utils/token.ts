import crypto from "crypto"

import * as g from "@/globalVars"
import prisma from "./prisma"

class _TokenManager {
    private static __instance: _TokenManager = new _TokenManager()
    private __rttl: number = g.REFRESH_TOKEN_EXP
    private __attl: number = g.ACCESS_TOKEN_EXP

    private constructor() { }

    public static getInstance(): _TokenManager {
        return _TokenManager.__instance
    }

    private __newToken(): string {
        return crypto.randomBytes(32).toString("hex")
    }

    public async setAccessToken(email: string): Promise<string> {
        /**
         * Assume account's token exists
         */
        const newTk = this.__newToken()
        await prisma.user.update({
            where: { email },
            data: {
                tokens: {
                    update: {
                        accessToken: newTk,
                        accessTokenExp: new Date(Date.now() + this.__attl)
                    }
                }
            }
        })
        return newTk
    }

    public async setRefreshToken(email: string):
        Promise<{ refreshToken: string, refreshTokenExp: Date }> {
        const newTk = this.__newToken()
        const newRExpiresAt = new Date(Date.now() + this.__rttl)
        await prisma.user.update({
            where: { email },
            data: {
                tokens: {
                    update: {
                        refreshToken: newTk,
                        refreshTokenExp: newRExpiresAt
                    }
                }
            }
        })
        return {
            refreshToken: newTk,
            refreshTokenExp: newRExpiresAt
        }
    }

    public async verifyAccessToken(accessToken: string):
        Promise<{ userEmail: string, userName: string | null } | null> {
        const tokenRecord = await prisma.token.findUnique({
            where: { accessToken },
            include: { user: true }
        })

        if (!tokenRecord || tokenRecord.accessTokenExp.getTime() <= Date.now())
            return null
        return {
            userEmail: tokenRecord.user.email,
            userName: tokenRecord.user.name
        }
    }

    /**
     * Refresh access token given a refresh token.
     * Refresh token is rotated as well.
     */
    public async refreshAccount(refreshToken: string):
        Promise<{
            accessToken: string,
            refreshToken: string,
            accessTokenExp: Date,
            refreshTokenExp: Date
        } | null> {
        const account = await prisma.token.findUnique({
            where: { refreshToken },
            include: { user: true }
        })
        const now = Date.now()
        if (!account || account.refreshTokenExp.getTime() <= now)
            return null

        const newAccessToken = this.__newToken()
        const newRefreshToken = this.__newToken()
        const accessTokenExp = new Date(now + this.__attl)
        await prisma.token.update({
            where: { userEmail: account.userEmail },
            data: {
                refreshToken: newRefreshToken,
                accessToken: newAccessToken,
                accessTokenExp
            }
        })
        return {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            accessTokenExp,
            refreshTokenExp: account.refreshTokenExp
        }
    }

    public async revokeToken(tk: string, type: "a" | "r") {
        const cond = type === "a" ? { accessToken: tk } : { refreshToken: tk }
        const data = type === "a" ? { accessTokenExp: new Date() } : { refreshTokenExp: new Date() }
        await prisma.token.update({
            where: cond,
            data
        })
    }
}

export default _TokenManager.getInstance()
