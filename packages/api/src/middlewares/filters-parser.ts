import { Context, Next } from "koa"
import { BadRequestError, KoaMiddlewareInterface } from "routing-controllers"
import { EntityPropertyNotFoundError, In } from "typeorm"
import { PG_INVALID_TEXT_REPRESENTATION } from "@drdgvhbh/postgres-error-codes"
import { isDbError } from "../util/is-db-error"

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
        } catch (err) {
            if (err instanceof EntityPropertyNotFoundError)
                throw new BadRequestError(err.message)
            // if input syntax is invalid
            else if (isDbError(err) && err.code === PG_INVALID_TEXT_REPRESENTATION)
                throw new BadRequestError(err.message)
            else
                throw err
        }
    }
}
