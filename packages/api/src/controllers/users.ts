import { Context, Next } from "koa"
import { getRepository } from "typeorm"
import { User } from "../entities/user"

export default {
    async getUser(id: string, ctx: Context, next: Next): Promise<Next> {
        ctx.user = await getRepository(User).findOne(id)
        if (!ctx.user)
            ctx.throw(404, "This user does not exist")

        return next()
    },

    async readAll(ctx: Context): Promise<void> {
        ctx.body = await getRepository(User).find()
    },

    async create(ctx: Context): Promise<void> {
        const user = getRepository(User).create(ctx.request.body)
        await getRepository(User).save(user)
        ctx.body = user
        ctx.status = 201
    },

    async read(ctx: Context): Promise<void> {
        ctx.body = ctx.user
    },

    async update(ctx: Context): Promise<void> {
        const { username, displayName, profilePicture } = ctx.request.body
        Object.assign(ctx.user, { username, displayName, profilePicture })
        await getRepository(User).save(ctx.user)
        ctx.body = ctx.user
    },

    async delete(ctx: Context): Promise<void> {
        await getRepository(User).remove(ctx.user)
        ctx.body = ctx.user
    },
}
