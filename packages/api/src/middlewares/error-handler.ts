import { Context, Next } from "koa"
import { ValidationError } from "class-validator"

export default async function (ctx: Context, next: Next): Promise<void> {
    try {
        await next()
    } catch (err) {
        if (Array.isArray(err) && err[0] instanceof ValidationError) {
            ctx.status = 422
            ctx.body = err
        } else {
            ctx.status = err.status ?? 500
            ctx.body = { error: err.name, message: err.message }
            ctx.app.emit("error", err, ctx)
        }
    }
}
