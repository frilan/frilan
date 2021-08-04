import Koa from "koa"
import logger from "koa-logger"
import cors from "@koa/cors"
import { useKoaServer } from "routing-controllers"
import { createConnection } from "typeorm"

import dbConfig from "./config/db"
import httpConfig from "./config/http"

import { LoginController } from "./controllers/login"
import { UserController } from "./controllers/users"
import { EventController } from "./controllers/events"
import { RegistrationController } from "./controllers/registrations"
import { EventTournamentController, TournamentController } from "./controllers/tournaments"
import { TeamController, TournamentTeamController } from "./controllers/teams"

import openapi from "./middlewares/swagger"
import { ErrorHandler } from "./middlewares/error-handler"
import { getAuthorizationFromToken, getUserFromToken, tokenDecoder } from "./middlewares/jwt-utils"

async function startServer() {
    try {
        await createConnection(dbConfig)

        const app = new Koa()

        if (process.env.NODE_ENV != "test")
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

        app.listen(httpConfig)

        const address = (httpConfig.host ?? "localhost") + ":" + httpConfig.port
        console.info("Listening on http://" + address)

    } catch (error) {
        console.error(error)
    }
}

startServer()
