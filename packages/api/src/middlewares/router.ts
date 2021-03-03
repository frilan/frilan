import Router from "koa-router"
import Users from "../controllers/users"

const router = new Router()
    .param("uid", Users.getUser)
    .get("/users", Users.readAll)
    .post("/users", Users.create)
    .get("/users/:uid", Users.read)
    .patch("/users/:uid", Users.update)
    .del("/users/:uid", Users.delete)

const routes = router.routes()
const allowedMethods = router.allowedMethods({throw: true})

export { routes, allowedMethods }
