import { Context, Next } from "koa"
import { HttpError, KoaMiddlewareInterface, Middleware } from "routing-controllers"

@Middleware({ type: "before" })
export class ErrorHandler implements KoaMiddlewareInterface {

    async use(ctx: Context, next: Next): Promise<void> {
        try {
            await next()
        } catch (error) {
            if (error instanceof HttpError) {
                const response: Record<string, unknown> = { ...error }
                delete response.httpCode
                delete response.name
                ctx.body = { error: error.name, ...response }
                ctx.status = error.httpCode
            } else {
                console.error(error)
                ctx.status = 500
            }
        }
    }
}
