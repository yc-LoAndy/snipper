class Env {
    private static instance: Env = new Env()
    private REQUIRED_KEYS: string[] = [
        "ENV",
        "PORT",
        "DATABASE_URL",
    ] as const
    private variables: { [K in (typeof this.REQUIRED_KEYS)[number]]: string | undefined } = {}

    // private constructor to ensure singleton
    private constructor() {
        for (const key of this.REQUIRED_KEYS) {
            if (key in process.env) {
                this.variables[key] = process.env[key]
            }
            else {
                throw new Error(`Env variable ${key} is not set.`)
            }
        }
    }

    public static getInstance(): Env {
        return Env.instance
    }

    public get(key: (typeof this.REQUIRED_KEYS)[number]): string {
        if (this.variables[key] === undefined) {
            throw new Error(`Env variables ${key} is not set.`)
        }
        return this.variables[key]
    }

}

export default Env.getInstance()
