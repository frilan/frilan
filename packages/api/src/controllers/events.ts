import { Body, Get, HttpCode, JsonController, NotFoundError, OnUndefined, Param, Post } from "routing-controllers"
import { getRepository } from "typeorm"
import { Event } from "@frilan/models"
import { PartialBody } from "../decorators/partial-body"
import { DeleteById, GetById, PatchById } from "../decorators/method-by-id"

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

    @GetById()
    @OnUndefined(EventNotFoundError)
    read(@Param("id") id: number): Promise<Event | undefined> {
        return getRepository(Event).findOne(id)
    }

    @PatchById()
    @OnUndefined(EventNotFoundError)
    async update(@Param("id") id: number, @PartialBody() event: Event): Promise<Event | undefined> {
        if (Object.keys(event).length)
            await getRepository(Event).update(id, event)
        return getRepository(Event).findOne(id)
    }

    @DeleteById()
    @OnUndefined(204)
    async delete(@Param("id") id: number): Promise<void> {
        await getRepository(Event).delete(id)
    }
}
