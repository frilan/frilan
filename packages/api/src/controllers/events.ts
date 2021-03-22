import {
    Body, Delete, Get, HttpCode, JsonController, NotFoundError, OnUndefined, Param, Patch, Post,
} from "routing-controllers"
import { getRepository } from "typeorm"
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity"
import { Event } from "../entities/event"

@JsonController("/events")
export class EventController {

    @Get()
    readAll(): Promise<Event[]> {
        return getRepository(Event).find()
    }

    @Post()
    @HttpCode(201)
    create(@Body() event: Event): Promise<Event> {
        return getRepository(Event).save(event)
    }

    @Get("/:id")
    async read(@Param("id") id: number): Promise<Event> {
        const event = await getRepository(Event).findOne(id)
        if (!event)
            throw new NotFoundError("This event does not exist")

        return event
    }

    @Patch("/:id")
    @OnUndefined(204)
    async update(@Param("id") id: number, @Body() event: QueryDeepPartialEntity<Event>): Promise<void> {
        await getRepository(Event).update(id, event)
    }

    @Delete("/:id")
    @OnUndefined(204)
    async delete(@Param("id") id: number): Promise<void> {
        await getRepository(Event).delete(id)
    }
}
