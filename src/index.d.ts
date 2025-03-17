declare namespace Express {
    interface Request {
        requestId: string
        userEmail: string
        userName: string | null
    }
    interface Response {
        validateAndSend: (body: unknown) => void
    }
}
