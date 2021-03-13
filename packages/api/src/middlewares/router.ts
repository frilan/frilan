import Router from "koa-router"

import Users from "../controllers/users"
import Events from "../controllers/events"
import Login from "../controllers/login"

import basicAuth from "./basic-auth"

const router = new Router()

    .get("/login", basicAuth, Login.login)

    .param("uid", Users.getUser)
    .get("/users", Users.readAll)
    .post("/users", Users.create)
    .get("/users/:uid", Users.read)
    .patch("/users/:uid", Users.update)
    .del("/users/:uid", Users.delete)

    .param("eid", Events.getEvent)
    .get("/events", Events.readAll)
    .post("/events", Events.create)
    .get("/events/:eid", Events.read)
    .patch("/events/:eid", Events.update)
    .del("/events/:eid", Events.delete)

const routes = router.routes()
const allowedMethods = router.allowedMethods({throw: true})

export { routes, allowedMethods }
