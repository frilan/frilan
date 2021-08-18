import { env } from "./env"

// prevent default secret when running in production
if (!process.env.JWT_SECRET && env == "prod") {
    console.error("The environment variable JWT_SECRET must be defined")
    process.exit(1)
}

const secret = process.env.JWT_SECRET ?? "secret"
const timeToLive = Number(process.env.JWT_TTL || 3600)
const expiresOn = (): number => Math.floor(Date.now() / 1000) + timeToLive

export default { secret, timeToLive, expiration: expiresOn }
