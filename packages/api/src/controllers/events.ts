import {
    Authorized, Body, Ctx, CurrentUser, ForbiddenError, Get, HttpCode, JsonController, NotFoundError, OnUndefined,
    Param, Post, UseBefore,
} from "routing-controllers"
import { getRepository } from "typeorm"
import { Event } from "@frilan/models"
import { PartialBody } from "../decorators/partial-body"
import { DeleteById, GetById, PatchById } from "../decorators/method-by-id"
import { RelationsParser } from "../middlewares/relations-parser"
import { Context } from "koa"
import { AuthUser } from "../middlewares/jwt-utils"

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
 * Restrict access to users that are registered to the provided event.
 *
 * @param user The authenticated user
 * @param event The event object or the ID of the event
 */
export async function checkEventPrivilege(user: AuthUser, event: Event | number): Promise<void> {
    if (user.admin)
        return

    // if not passing an ID as argument
    if (typeof event != "number")
        event = event.id

    if (!(event in user.roles))
        throw new ForbiddenError("Access is restricted to users registered to this event")
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
     *       401:
     *         $ref: "#/components/responses/AuthenticationRequired"
     *       403:
     *         $ref: "#/components/responses/NotEnoughPrivilege"
     */
    @Get()
    @UseBefore(RelationsParser)
    @Authorized("admin")
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
     *       401:
     *         $ref: "#/components/responses/AuthenticationRequired"
     *       403:
     *         $ref: "#/components/responses/NotEnoughPrivilege"
     */
    @Post()
    @HttpCode(201)
    @Authorized("admin")
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
     *       401:
     *         $ref: "#/components/responses/AuthenticationRequired"
     *       403:
     *         $ref: "#/components/responses/NotEnoughPrivilege"
     *       404:
     *         $ref: "#/components/responses/EventNotFound"
     */
    @GetById()
    @OnUndefined(EventNotFoundError)
    @UseBefore(RelationsParser)
    async read(
        @Param("id") id: number,
        @CurrentUser({ required: true }) user: AuthUser,
        @Ctx() ctx: Context,
    ): Promise<Event | undefined> {

        await checkEventPrivilege(user, id)
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
     *       401:
     *         $ref: "#/components/responses/AuthenticationRequired"
     *       403:
     *         $ref: "#/components/responses/NotEnoughPrivilege"
     *       404:
     *         $ref: "#/components/responses/EventNotFound"
     */
    @PatchById()
    @OnUndefined(EventNotFoundError)
    @Authorized("admin")
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
     *       401:
     *         $ref: "#/components/responses/AuthenticationRequired"
     *       403:
     *         $ref: "#/components/responses/NotEnoughPrivilege"
     */
    @DeleteById()
    @OnUndefined(204)
    @Authorized("admin")
    async delete(@Param("id") id: number): Promise<void> {
        await getRepository(Event).delete(id)
    }
}
