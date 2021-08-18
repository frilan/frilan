import Koa from "koa"
import logger from "koa-logger"
import cors from "@koa/cors"
import { Server } from "http"
import { AddressInfo } from "net"
import { useKoaServer } from "routing-controllers"
import { Connection, createConnection } from "typeorm"

import dbConfig from "./config/db"
import httpConfig from "./config/http"
import { env } from "./config/env"

import { LoginController } from "./controllers/login"
import { UserController } from "./controllers/users"
import { EventController } from "./controllers/events"
import { RegistrationController } from "./controllers/registrations"
import { EventTournamentController, TournamentController } from "./controllers/tournaments"
import { TeamController, TournamentTeamController } from "./controllers/teams"

import openapi from "./middlewares/swagger"
import { ErrorHandler } from "./middlewares/error-handler"
import { getAuthorizationFromToken, getUserFromToken, tokenDecoder } from "./middlewares/jwt-utils"

let server: Server | undefined
let dbConnection: Connection | undefined

export async function startServer(): Promise<string> {
    dbConnection = await createConnection(dbConfig)

    const app = new Koa()

    if (env != "test")
        app.use(logger())

    app.use(cors())
    app.use(openapi())
    app.use(tokenDecoder())

    useKoaServer(app, {
        middlewares: [ErrorHandler],
        defaultErrorHandler: false,
        authorizationChecker: getAuthorizationFromToken,
        currentUserChecker: getUserFromToken,
        controllers: [
            LoginController,
            UserController,
            EventController,
            RegistrationController,
            EventTournamentController,
            TournamentController,
            TournamentTeamController,
            TeamController,
        ],
    })

    server = app.listen(httpConfig)
    const { port } = server.address() as AddressInfo
    return "http://" + (httpConfig.host ?? "localhost") + ":" + port
}

export async function stopServer(): Promise<void> {
    server?.close()
    await dbConnection?.close()
}
