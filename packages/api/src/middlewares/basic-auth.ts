import { Context, Next } from "koa"
import auth from "basic-auth"
import { KoaMiddlewareInterface, UnauthorizedError } from "routing-controllers"

export class BasicAuth implements KoaMiddlewareInterface {

    use(ctx: Context, next: Next): ReturnType<Next> {

        ctx.credentials = auth(ctx.req)
        if (!ctx.credentials)
            throw new UnauthorizedError("Basic authentication is required")

        return next()
    }
}
