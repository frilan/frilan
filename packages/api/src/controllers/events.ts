import {
    Body, Ctx, Get, HttpCode, JsonController, NotFoundError, OnUndefined, Param, Post, UseBefore,
} from "routing-controllers"
import { getRepository } from "typeorm"
import { Event } from "@frilan/models"
import { PartialBody } from "../decorators/partial-body"
import { DeleteById, GetById, PatchById } from "../decorators/method-by-id"
import { RelationsParser } from "../middlewares/relations-parser"
import { Context } from "koa"

/**
 * @openapi
 * components:
 *   responses:
 *     EventNotFound:
 *       description: event not found
 */
export class EventNotFoundError extends NotFoundError {
    name = "EventNotFoundError"

    constructor() {
        super("This event does not exist")
    }
}

/**
 * @openapi
 * components:
 *   parameters:
 *     EventId:
 *       name: event-id
 *       in: path
 *       schema:
 *         type: integer
 *         example: 1
 *       required: true
 *       description: the ID of an existing event
 *
 *     EventRelations:
 *       name: load
 *       in: query
 *       schema:
 *         type: string
 *         example: registrations,tournaments
 *       description: load related resources into response
 */
@JsonController("/events")
export class EventController {

    /**
     * @openapi
     * /events:
     *   get:
     *     summary: get all events
     *     tags:
     *       - events
     *     parameters:
     *       - $ref: "#/components/parameters/EventRelations"
     *     responses:
     *       200:
     *         description: success
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: "#/components/schemas/EventWithId"
     */
    @Get()
    @UseBefore(RelationsParser)
    readAll(@Ctx() ctx: Context): Promise<Event[]> {
        return getRepository(Event).find({ relations: ctx.relations })
    }

    /**
     * @openapi
     * /events:
     *   post:
     *     summary: create a new event
     *     tags:
     *       - events
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *            $ref: "#/components/schemas/Event"
     *     responses:
     *       201:
     *         description: event created
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/EventWithId"
     *       400:
     *         $ref: "#/components/responses/ValidationError"
     */
    @Post()
    @HttpCode(201)
    create(@Body() event: Event): Promise<Event> {
        return getRepository(Event).save(event)
    }

    /**
     * @openapi
     * /events/{event-id}:
     *   get:
     *     summary: get a single event
     *     tags:
     *       - events
     *     parameters:
     *       - $ref: "#/components/parameters/EventId"
     *       - $ref: "#/components/parameters/EventRelations"
     *     responses:
     *       200:
     *         description: success
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/EventWithId"
     *       404:
     *         $ref: "#/components/responses/EventNotFound"
     */
    @GetById()
    @OnUndefined(EventNotFoundError)
    @UseBefore(RelationsParser)
    read(@Param("id") id: number, @Ctx() ctx: Context): Promise<Event | undefined> {
        return getRepository(Event).findOne(id, { relations: ctx.relations })
    }

    /**
     * @openapi
     * /events/{event-id}:
     *   patch:
     *     summary: update an existing event
     *     tags:
     *       - events
     *     parameters:
     *       - $ref: "#/components/parameters/EventId"
     *     requestBody:
     *       content:
     *         application/json:
     *           schema:
     *            $ref: "#/components/schemas/Event"
     *     responses:
     *       200:
     *         description: event updated
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/EventWithId"
     *       400:
     *         $ref: "#/components/responses/ValidationError"
     *       404:
     *         $ref: "#/components/responses/EventNotFound"
     */
    @PatchById()
    @OnUndefined(EventNotFoundError)
    async update(@Param("id") id: number, @PartialBody() event: Event): Promise<Event | undefined> {
        if (Object.keys(event).length)
            await getRepository(Event).update(id, event)
        return getRepository(Event).findOne(id)
    }

    /**
     * @openapi
     * /events/{event-id}:
     *   delete:
     *     summary: delete an existing event
     *     tags:
     *       - events
     *     parameters:
     *       - $ref: "#/components/parameters/EventId"
     *     responses:
     *       204:
     *         description: event deleted
     */
    @DeleteById()
    @OnUndefined(204)
    async delete(@Param("id") id: number): Promise<void> {
        await getRepository(Event).delete(id)
    }
}
