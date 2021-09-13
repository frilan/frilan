import { ListenOptions } from "net"
import { env } from "./env"

// use port 0 when testing, i.e. any available port
const defaultPort = env === "test" ? 0 : 8080

const port = process.env.HTTP_PORT ? Number.parseInt(process.env.HTTP_PORT) : defaultPort
const host = process.env.HTTP_HOST ?? undefined

const config: ListenOptions = { port, host }
export default config
