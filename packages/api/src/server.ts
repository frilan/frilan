import Koa from "koa"
import logger from "koa-logger"
import cors from "@koa/cors"
import bodyParser from "koa-bodyparser"
import { createConnection } from "typeorm"

import dbConfig from "./config/db"
import httpConfig from "./config/http"

import errorHandler from "./middlewares/error-handler"
import { allowedMethods, routes } from "./middlewares/router"

async function startServer() {
    try {
        await createConnection(dbConfig)

        const app = new Koa()

        if (process.env.NODE_ENV != "test")
            app.use(logger())

        app.use(errorHandler)
            .use(cors())
            .use(bodyParser())
            .use(routes)
            .use(allowedMethods)

        app.listen(httpConfig)

        const address = (httpConfig.host ?? "localhost") + ":" + httpConfig.port
        console.info("Listening on http://" + address)

    } catch (error) {
        console.error(error)
    }
}

startServer()
