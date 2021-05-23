import { Context, Next } from "koa"
import { BadRequestError, KoaMiddlewareInterface } from "routing-controllers"
import { FindRelationsNotFoundError } from "typeorm"

export class RelationsParser implements KoaMiddlewareInterface {

    async use(ctx: Context, next: Next): ReturnType<Next> {

        // parse "load" parameter in query string
        if (ctx.request.query.load) {
            let relations: string[]
            if (Array.isArray(ctx.request.query.load))
                relations = ctx.request.query.load.map(p => p.split(",")).flat()
            else
                relations = ctx.request.query.load.split(",")

            ctx.relations = [...new Set(relations)]
        } else
            ctx.relations = []

        try {
            await next()
        } catch (e) {
            if (e instanceof FindRelationsNotFoundError)
                throw new BadRequestError(e.message.split(";")[0])
            else
                throw e
        }
    }
}
