import { Context, Next } from "koa"
import { QueryFailedError } from "typeorm"

export default async function (ctx: Context, next: Next): Promise<void> {
    try {
        await next()
    } catch (err) {
        if (err instanceof QueryFailedError)
            ctx.status = 400
        else
            ctx.status = err.status ?? 500

        ctx.body = { error: err.name, message: err.message }
        ctx.app.emit("error", err, ctx)
    }
}
