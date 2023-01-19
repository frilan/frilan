import {
    Authorized, Body, Ctx, Get, HttpCode, HttpError, JsonController, NotFoundError, OnNull, OnUndefined, Param, Post,
    UseBefore,
} from "routing-controllers"
import { Event } from "@frilan/models"
import { PartialBody } from "../decorators/partial-body"
import { DeleteById, GetById, PatchById } from "../decorators/method-by-id"
import { RelationsParser } from "../middlewares/relations-parser"
import { Context } from "koa"
import { FiltersParser } from "../middlewares/filters-parser"
import { isDbError } from "../util/is-db-error"
import { PG_UNIQUE_VIOLATION } from "@drdgvhbh/postgres-error-codes"
import { EntityClass, EntityEventType, entitySubscriber } from "../util/entity-subscriber"
import db from "../config/db"

const repository = db.getRepository(Event)

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
 *   responses:
 *     EventConflict:
 *       description: short name already taken
 */
export class EventConflictError extends HttpError {
    name = "EventConflictError"

    constructor() {
        super(409, "An event with this short name already exists")
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
     *       401:
     *         $ref: "#/components/responses/AuthenticationRequired"
     */
    @Get()
    @UseBefore(RelationsParser, FiltersParser)
    @Authorized()
    readAll(@Ctx() ctx: Context): Promise<Event[]> {
        return repository.find({ relations: ctx.relations, where: ctx.filters })
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
     *       409:
     *         $ref: "#/components/responses/EventConflict"
     */
    @Post()
    @HttpCode(201)
    @Authorized("admin")
    async create(@Body() event: Event): Promise<Event> {
        try {
            const savedEvent = await repository.save(event)
            entitySubscriber.emit(EntityEventType.Create, EntityClass.Event, savedEvent)
            return savedEvent

        } catch (err) {
            if (isDbError(err) && err.code === PG_UNIQUE_VIOLATION)
                throw new EventConflictError()
            else
                throw err
        }
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
     *       404:
     *         $ref: "#/components/responses/EventNotFound"
     */
    @GetById()
    @OnNull(EventNotFoundError)
    @UseBefore(RelationsParser)
    @Authorized()
    read(@Param("id") id: number, @Ctx() ctx: Context): Promise<Event | null> {
        return repository.findOne({ where: { id }, relations: ctx.relations })
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
    @OnNull(EventNotFoundError)
    @Authorized("admin")
    async update(@Param("id") id: number, @PartialBody() event: Event): Promise<Event | null> {
        if (Object.keys(event).length)
            try {
                await repository.update(id, event)
            } catch (err) {
                if (isDbError(err) && err.code === PG_UNIQUE_VIOLATION)
                    throw new EventConflictError()
                else
                    throw err
            }

        const savedEvent = await repository.findOneBy({ id })
        entitySubscriber.emit(EntityEventType.Update, EntityClass.Event, savedEvent)
        return savedEvent
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
        await repository.delete(id)
        entitySubscriber.emit(EntityEventType.Delete, EntityClass.Event, { id })
    }
}
