import Koa from "koa"
import logger from "koa-logger"
import cors from "@koa/cors"

import { useKoaServer } from "routing-controllers"
import { createConnection } from "typeorm"

import dbConfig from "./config/db"
import httpConfig from "./config/http"

import { UserController } from "./controllers/users"
import { EventController } from "./controllers/events"
import { LoginController } from "./controllers/login"
import { RegistrationController } from "./controllers/registrations"

async function startServer() {
    try {
        await createConnection(dbConfig)

        const app = new Koa()

        if (process.env.NODE_ENV != "test")
            app.use(logger())

        app.use(cors())

        useKoaServer(app, {
            controllers: [
                UserController,
                EventController,
                RegistrationController,
                LoginController],
        })

        app.listen(httpConfig)

        const address = (httpConfig.host ?? "localhost") + ":" + httpConfig.port
        console.info("Listening on http://" + address)

    } catch (error) {
        console.error(error)
    }
}

startServer()
