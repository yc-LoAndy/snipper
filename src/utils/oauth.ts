import { OAuth2Client } from "google-auth-library"

export default (async (accessToken: string) => {
    const oauth2Client = new OAuth2Client()
    oauth2Client.setCredentials({ access_token: accessToken })

    const userInfo = (await oauth2Client.request({
        url: "https://www.googleapis.com/oauth2/v3/userinfo"
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    })).data as any

    oauth2Client.revokeCredentials()
    return {
        id: userInfo.sub,
        name: userInfo.name,
        avatar: userInfo.picture,
        email: userInfo.email,
        emailVerified: userInfo.email_verified,
    }
})
