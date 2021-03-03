import { ListenOptions } from "net"

const port = Number.parseInt(process.env.HTTP_PORT ?? "80")
const host = process.env.HTTP_HOST ?? undefined

export default { port, host } as ListenOptions
