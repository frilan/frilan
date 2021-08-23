import { Context, Next } from "koa"
import { BadRequestError, KoaMiddlewareInterface } from "routing-controllers"
import { EntityColumnNotFound, In, QueryFailedError } from "typeorm"

export class FiltersParser implements KoaMiddlewareInterface {

    async use(ctx: Context, next: Next): ReturnType<Next> {

        // parse filter parameters in query string
        const filters = Object.entries(ctx.request.query)
            .filter((entry): entry is [string, string | string[]] => entry[0] !== "load" && Boolean(entry[1]))
            .map(([field, value]) => {
                if (Array.isArray(value))
                    return [field, In(value.map(v => v.split(",")).flat())]
                else if (value.includes(","))
                    return [field, In(value.split(","))]
                else
                    return [field, value]
            })
        ctx.filters = Object.fromEntries(filters)

        try {
            await next()
        } catch (e) {
            if (e instanceof EntityColumnNotFound)
                throw new BadRequestError(e.message)
            else if (isQueryError(e) && e.code === "22P02")
                throw new BadRequestError(e.message)
            else
                throw e
        }
    }
}

// interface for QueryFailedError objects, required because the
// type declaration is missing some properties such as "code"
interface QueryError {
    name: string
    code: string
    message: string
}

function isQueryError(error: Error): error is QueryError {
    return error instanceof QueryFailedError
}
