import { Context, Next } from "koa"
import auth from "basic-auth"

export default async function (ctx: Context, next: Next): Promise<void> {
    ctx.credentials = auth(ctx.req)
    if (!ctx.credentials) {
        ctx.throw(401, "Basic authentication is required")
    }

    await next()
}
