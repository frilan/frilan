import { DataSource } from "typeorm"
import { SnakeNamingStrategy } from "typeorm-naming-strategies"
import { Event, Registration, Team, Tournament, User } from "@frilan/models"
import { env } from "./env"

if (!process.env.DB_PASS) {
    console.error("The environment variable DB_PASS must be defined")
    process.exit(1)
}

const host = process.env.DB_HOST ?? "localhost"
const port = Number.parseInt(process.env.DB_PORT ?? "5432")
const database = process.env.DB_NAME ?? "frilan"
const testDatabase = process.env.DB_TEST ?? "frilan-test"
const username = process.env.DB_USER ?? "postgres"
const password = process.env.DB_PASS

// scripts have different paths & extension when running in production
const root = env === "prod" ? "build" : "src"
const ext = env === "prod" ? "js" : "ts"

const db = new DataSource({
    type: "postgres",
    host,
    port,
    username,
    password,
    database: env === "test" ? testDatabase : database,
    migrationsRun: true,
    logging: env === "dev",
    dropSchema: env === "test",
    namingStrategy: new SnakeNamingStrategy(),
    entities: [User, Event, Registration, Tournament, Team],
    migrations: [root + "/migrations/*." + ext],
})

export default db
