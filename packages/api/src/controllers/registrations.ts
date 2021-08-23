import {
    Authorized, Body, Ctx, CurrentUser, Delete, ForbiddenError, Get, JsonController, NotFoundError, OnUndefined, Param,
    Put, UseBefore,
} from "routing-controllers"
import { getRepository } from "typeorm"
import { Registration, Role } from "@frilan/models"
import { PG_FOREIGN_KEY_VIOLATION } from "@drdgvhbh/postgres-error-codes"
import { RelationsParser } from "../middlewares/relations-parser"
import { Context } from "koa"
import { AuthUser } from "../middlewares/jwt-utils"
import { FiltersParser } from "../middlewares/filters-parser"

/**
 * @openapi
 * components:
 *   responses:
 *     RegistrationNotFound:
 *       description: registration not found
 */
export class RegistrationNotFoundError extends NotFoundError {
    name = "RegistrationNotFoundError"

    constructor() {
        super("This registration does not exist")
    }
}

/**
 * @openapi
 * components:
 *   parameters:
 *     RegistrationRelations:
 *       name: load
 *       in: query
 *       schema:
 *         type: string
 *         example: user,event
 *       description: load related resources into response
 */
@JsonController("/events/:event_id(\\d+)/registrations")
export class RegistrationController {

    /**
     * @openapi
     * /events/{event-id}/registrations:
     *   get:
     *     summary: get all registrations for an event
     *     tags:
     *       - registrations
     *     parameters:
     *       - $ref: "#/components/parameters/EventId"
     *       - $ref: "#/components/parameters/RegistrationRelations"
     *     responses:
     *       200:
     *         description: success
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: "#/components/schemas/RegistrationWithIds"
     *       401:
     *         $ref: "#/components/responses/AuthenticationRequired"
     */
    @Get()
    @UseBefore(RelationsParser, FiltersParser)
    @Authorized()
    async readAll(@Param("event_id") eventId: number, @Ctx() ctx: Context): Promise<Registration[]> {
        // prevent filtering by event ID
        delete ctx.filters.eventId
        return getRepository(Registration).find({ where: { eventId, ...ctx.filters }, relations: ctx.relations })
    }

    /**
     * @openapi
     * /events/{event-id}/registrations/{user-id}:
     *   put:
     *     summary: register a user to an event, or update an existing registration
     *     tags:
     *       - registrations
     *     parameters:
     *       - $ref: "#/components/parameters/EventId"
     *       - $ref: "#/components/parameters/UserId"
     *     requestBody:
     *       content:
     *         application/json:
     *           schema:
     *            $ref: "#/components/schemas/Registration"
     *     responses:
     *       201:
     *         description: success
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: "#/components/schemas/RegistrationWithIds"
     *       400:
     *         $ref: "#/components/responses/ValidationError"
     *       401:
     *         $ref: "#/components/responses/AuthenticationRequired"
     *       403:
     *         $ref: "#/components/responses/NotEnoughPrivilege"
     *       404:
     *         description: the specified event and/or user don't exist
     */
    @Put("/:user_id(\\d+)")
    async put(
        @Param("event_id") eventId: number,
        @Param("user_id") userId: number,
        @CurrentUser({ required: true }) user: AuthUser,
        @Body() registration: Registration,
    ): Promise<Registration> {

        if (!user.admin && user.id !== userId)
            throw new ForbiddenError("Only administrators can register other users")

        if (!user.admin && registration.role === Role.Organizer)
            throw new ForbiddenError("Only administrators can register users as organizers")

        try {
            registration.eventId = eventId
            registration.userId = userId
            return await getRepository(Registration).save(registration)
        } catch (err) {
            if (err.code === PG_FOREIGN_KEY_VIOLATION)
                throw new NotFoundError(err.detail)
            else
                throw err
        }
    }

    /**
     * @openapi
     * /events/{event-id}/registrations/{user-id}:
     *   get:
     *     summary: get the registration of a user to an event
     *     tags:
     *       - registrations
     *     parameters:
     *       - $ref: "#/components/parameters/EventId"
     *       - $ref: "#/components/parameters/UserId"
     *       - $ref: "#/components/parameters/RegistrationRelations"
     *     responses:
     *       200:
     *         description: success
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/RegistrationWithIds"
     *       401:
     *         $ref: "#/components/responses/AuthenticationRequired"
     *       404:
     *         $ref: "#/components/responses/RegistrationNotFound"
     */
    @Get("/:user_id(\\d+)")
    @OnUndefined(RegistrationNotFoundError)
    @UseBefore(RelationsParser)
    @Authorized()
    read(
        @Param("event_id") eventId: number,
        @Param("user_id") userId: number,
        @Ctx() ctx: Context,
    ): Promise<Registration | undefined> {

        return getRepository(Registration).findOne({ eventId, userId }, { relations: ctx.relations })
    }

    /**
     * @openapi
     * /events/{event-id}/registrations/{user-id}:
     *   delete:
     *     summary: unregister a user from an event
     *     tags:
     *       - registrations
     *     parameters:
     *       - $ref: "#/components/parameters/EventId"
     *       - $ref: "#/components/parameters/UserId"
     *     responses:
     *       204:
     *         description: registration deleted
     *       401:
     *         $ref: "#/components/responses/AuthenticationRequired"
     *       403:
     *         $ref: "#/components/responses/NotEnoughPrivilege"
     */
    @Delete("/:user_id(\\d+)")
    @OnUndefined(204)
    async delete(
        @Param("event_id") eventId: number,
        @Param("user_id") userId: number,
        @CurrentUser({ required: true }) user: AuthUser,
    ): Promise<void> {

        if (!user.admin && user.id !== userId)
            throw new ForbiddenError("Only administrators can unregister other users")

        await getRepository(Registration).delete({ eventId, userId })
    }
}
