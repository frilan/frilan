import { ConnectionOptions } from "typeorm"

if (!process.env.DB_PASS) {
    console.error("The environment variable DB_PASS must be defined")
    process.exit(1)
}

const host = process.env.DB_HOST ?? "localhost"
const port = Number.parseInt(process.env.DB_PORT ?? "5432")
const database = process.env.DB_NAME ?? "frilan"
const username = process.env.DB_USER ?? "postgres"
const password = process.env.DB_PASS

const root = process.env.TS_NODE_DEV ? "src" : "build"
const ext = process.env.TS_NODE_DEV ? "ts" : "js"

const config: ConnectionOptions = {
    type: "postgres",
    host,
    port,
    username,
    password,
    database,
    logging: true,
    migrationsRun: true,
    entities: [root + "/entities/*." + ext],
    migrations: [root + "/migrations/*." + ext],
    subscribers: [root + "/subscribers/*." + ext],
    cli: {
        entitiesDir: "src/entities",
        migrationsDir: "src/migrations",
        subscribersDir: "src/subscribers",
    },
}

export default config
