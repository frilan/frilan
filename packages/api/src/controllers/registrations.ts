import {
    Body, Delete, Get, HttpCode, JsonController, NotFoundError, OnUndefined, Param, Put,
} from "routing-controllers"
import { getRepository } from "typeorm"
import { Registration } from "@frilan/models"
import { PG_FOREIGN_KEY_VIOLATION } from "@drdgvhbh/postgres-error-codes"

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
     *     responses:
     *       200:
     *         description: success
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: "#/components/schemas/RegistrationWithIds"
     */
    @Get()
    readAll(@Param("event_id") eventId: number): Promise<Registration[]> {
        return getRepository(Registration).find({ where: { eventId } })
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
     *       404:
     *         description: the specified event and/or user don't exist
     */
    @Put("/:user_id(\\d+)")
    @HttpCode(201)
    async put(
        @Param("event_id") eventId: number,
        @Param("user_id") userId: number,
        @Body() registration: Registration,
    ): Promise<Registration> {
        try {
            registration.eventId = eventId
            registration.userId = userId
            return await getRepository(Registration).save(registration)
        } catch (err) {
            if (err.code == PG_FOREIGN_KEY_VIOLATION)
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
     *     responses:
     *       200:
     *         description: success
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/RegistrationWithIds"
     *       404:
     *         $ref: "#/components/responses/RegistrationNotFound"
     */
    @Get("/:user_id(\\d+)")
    @OnUndefined(RegistrationNotFoundError)
    read(@Param("event_id") eventId: number, @Param("user_id") userId: number): Promise<Registration | undefined> {
        return getRepository(Registration).findOne({ eventId, userId })
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
     */
    @Delete("/:user_id(\\d+)")
    @OnUndefined(204)
    async delete(@Param("event_id") eventId: number, @Param("user_id") userId: number): Promise<void> {
        await getRepository(Registration).delete({ eventId, userId })
    }
}
