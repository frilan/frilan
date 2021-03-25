import {
    Body, Delete, Get, HttpCode, JsonController, NotFoundError, OnUndefined, Param, Patch, Post,
} from "routing-controllers"
import { getRepository } from "typeorm"
import { Event } from "../entities/event"
import { PartialBody } from "../decorators/partial-body"

export class EventNotFoundError extends NotFoundError {
    name = "EventNotFoundError"

    constructor() {
        super("This event does not exist")
    }
}

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
    @OnUndefined(EventNotFoundError)
    read(@Param("id") id: number): Promise<Event | undefined> {
        return getRepository(Event).findOne(id)
    }

    @Patch("/:id")
    @OnUndefined(EventNotFoundError)
    async update(@Param("id") id: number, @PartialBody() event: Event): Promise<Event | undefined> {
        await getRepository(Event).update(id, event)
        return getRepository(Event).findOne(id)
    }

    @Delete("/:id")
    @OnUndefined(204)
    async delete(@Param("id") id: number): Promise<void> {
        await getRepository(Event).delete(id)
    }
}
