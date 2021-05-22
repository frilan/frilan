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
import { TournamentController } from "./controllers/tournaments"
import { TeamController } from "./controllers/teams"

import openapi from "./middlewares/swagger"
import { ErrorHandler } from "./middlewares/error-handler"

async function startServer() {
    try {
        await createConnection(dbConfig)

        const app = new Koa()

        if (process.env.NODE_ENV != "test")
            app.use(logger())

        app.use(cors())
        app.use(openapi())

        useKoaServer(app, {
            middlewares: [ErrorHandler],
            defaultErrorHandler: false,
            controllers: [
                LoginController,
                UserController,
                EventController,
                RegistrationController,
                TournamentController,
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
