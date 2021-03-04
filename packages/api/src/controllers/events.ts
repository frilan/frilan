import { Context, Next } from "koa"
import { getRepository } from "typeorm"
import { Event } from "../entities/event"

export default {
    async getEvent(id: string, ctx: Context, next: Next): Promise<Next> {
        ctx.event = await getRepository(Event).findOne(id)
        if (!ctx.event)
            ctx.throw(404, "This event does not exist")

        return next()
    },

    async readAll(ctx: Context): Promise<void> {
        ctx.body = await getRepository(Event).find()
    },

    async create(ctx: Context): Promise<void> {
        const event = getRepository(Event).create(ctx.request.body)
        await getRepository(Event).save(event)
        ctx.body = event
        ctx.status = 201
    },

    async read(ctx: Context): Promise<void> {
        ctx.body = ctx.event
    },

    async update(ctx: Context): Promise<void> {
        const { name } = ctx.request.body
        Object.assign(ctx.event, { name })
        await getRepository(Event).save(ctx.event)
        ctx.body = ctx.event
    },

    async delete(ctx: Context): Promise<void> {
        await getRepository(Event).remove(ctx.event)
        ctx.body = ctx.event
    },
}
