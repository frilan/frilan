import { Body, Get, HttpCode, JsonController, NotFoundError, OnUndefined, Param, Post } from "routing-controllers"
import { getRepository } from "typeorm"
import { PG_FOREIGN_KEY_VIOLATION } from "@drdgvhbh/postgres-error-codes"
import { DeleteById, GetById, PatchById } from "../decorators/method-by-id"
import { PartialBody } from "../decorators/partial-body"
import { Tournament } from "@frilan/models"

/**
 * @openapi
 * components:
 *   responses:
 *     TournamentNotFound:
 *       description: tournament not found
 */
export class TournamentNotFoundError extends NotFoundError {
    name = "TournamentNotFoundError"

    constructor() {
        super("This tournament does not exist")
    }
}

/**
 * @openapi
 * components:
 *   parameters:
 *     TournamentId:
 *       name: tournament-id
 *       in: path
 *       schema:
 *         type: integer
 *       required: true
 *       description: the ID of an existing tournament
 */
@JsonController("/events/:event_id(\\d+)/tournaments")
export class TournamentController {

    /**
     * @openapi
     * /events/{event-id}/tournaments:
     *   get:
     *     summary: get all tournaments for an event
     *     tags:
     *       - tournaments
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
     *                 $ref: "#/components/schemas/TournamentWithId"
     */
    @Get()
    readAll(@Param("event_id") eventId: number): Promise<Tournament[]> {
        return getRepository(Tournament).find({ where: { eventId } })
    }

    /**
     * @openapi
     * /events/{event-id}/tournaments:
     *   post:
     *     summary: create a new tournament
     *     tags:
     *       - tournaments
     *     parameters:
     *       - $ref: "#/components/parameters/EventId"
     *     requestBody:
     *       content:
     *         application/json:
     *           schema:
     *            $ref: "#/components/schemas/Tournament"
     *     responses:
     *       201:
     *         description: tournament created
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: "#/components/schemas/TournamentWithId"
     *       400:
     *         $ref: "#/components/responses/ValidationError"
     *       404:
     *          description: the specified event doesn't exist
     */
    @Post()
    @HttpCode(201)
    async create(@Param("event_id") eventId: number, @Body() tournament: Tournament): Promise<Tournament> {
        try {
            tournament.eventId = eventId
            return await getRepository(Tournament).save(tournament)
        } catch (err) {
            if (err.code == PG_FOREIGN_KEY_VIOLATION)
                throw new NotFoundError(err.detail)
            else
                throw err
        }
    }

    /**
     * @openapi
     * /events/{event-id}/tournaments/{tournament-id}:
     *   get:
     *     summary: get a tournament in an event
     *     tags:
     *       - tournaments
     *     parameters:
     *       - $ref: "#/components/parameters/EventId"
     *       - $ref: "#/components/parameters/TournamentId"
     *     responses:
     *       200:
     *         description: success
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/TournamentWithId"
     *       404:
     *         $ref: "#/components/responses/TournamentNotFound"
     */
    @GetById()
    @OnUndefined(TournamentNotFoundError)
    read(@Param("event_id") eventId: number, @Param("id") id: number): Promise<Tournament | undefined> {
        return getRepository(Tournament).findOne({ id, eventId })
    }

    /**
     * @openapi
     * /events/{event-id}/tournaments/{tournament-id}:
     *   patch:
     *     summary: update an existing tournament
     *     tags:
     *       - tournaments
     *     parameters:
     *       - $ref: "#/components/parameters/EventId"
     *       - $ref: "#/components/parameters/TournamentId"
     *     requestBody:
     *       content:
     *         application/json:
     *           schema:
     *            $ref: "#/components/schemas/Tournament"
     *     responses:
     *       200:
     *         description: tournament updated
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/TournamentWithId"
     *       400:
     *         $ref: "#/components/responses/ValidationError"
     *       404:
     *         $ref: "#/components/responses/TournamentNotFound"
     */
    @PatchById()
    @OnUndefined(TournamentNotFoundError)
    async update(
        @Param("event_id") eventId: number,
        @Param("id") id: number,
        @PartialBody() tournament: Tournament,
    ): Promise<Tournament | undefined> {
        if (Object.keys(tournament).length)
            await getRepository(Tournament).update({ id, eventId }, tournament)
        return getRepository(Tournament).findOne({ id, eventId })
    }

    /**
     * @openapi
     * /events/{event-id}/tournaments/{tournament-id}:
     *   delete:
     *     summary: delete a tournament from an event
     *     tags:
     *       - tournaments
     *     parameters:
     *       - $ref: "#/components/parameters/EventId"
     *       - $ref: "#/components/parameters/TournamentId"
     *     responses:
     *       204:
     *         description: tournament deleted
     */
    @DeleteById()
    @OnUndefined(204)
    async delete(@Param("event_id") eventId: number, @Param("id") id: number): Promise<void> {
        await getRepository(Tournament).delete({ id, eventId })
    }
}
