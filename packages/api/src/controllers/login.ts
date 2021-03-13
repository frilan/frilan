import { Context } from "koa"
import { getRepository } from "typeorm"
import { User } from "../entities/user"

export default {
    async login(ctx: Context): Promise<void> {
        const username = ctx.credentials.name
        const user = await getRepository(User).findOne({ username })

        if (!user)
            ctx.throw(401, "Wrong username and/or password")

        ctx.body = user
    },
}
