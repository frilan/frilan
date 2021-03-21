import { Context, Next } from "koa"
import { getRepository } from "typeorm"
import { User } from "../entities/user"
import { PG_UNIQUE_VIOLATION } from "@drdgvhbh/postgres-error-codes"
import { plainToClass } from "class-transformer"

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
        const user = plainToClass(User, ctx.request.body)

        try {
            ctx.body = await getRepository(User).save(user)
            ctx.status = 201

        } catch (err) {
            if (err.code == PG_UNIQUE_VIOLATION)
                ctx.throw(409, "This user name is already taken")
            else
                throw err
        }
    },

    async read(ctx: Context): Promise<void> {
        ctx.body = ctx.user
    },

    async update(ctx: Context): Promise<void> {
        Object.assign(ctx.user, ctx.request.body)
        const user = plainToClass(User, ctx.user)
        ctx.body = await getRepository(User).save(user)
    },

    async delete(ctx: Context): Promise<void> {
        await getRepository(User).remove(ctx.user.id)
        ctx.body = ctx.user
    },
}
