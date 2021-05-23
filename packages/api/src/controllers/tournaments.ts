import {
    Body, Ctx, Get, HttpCode, JsonController, NotFoundError, OnUndefined, Param, Post, UseBefore,
} from "routing-controllers"
import { getRepository } from "typeorm"
import { PG_FOREIGN_KEY_VIOLATION } from "@drdgvhbh/postgres-error-codes"
import { DeleteById, GetById, PatchById } from "../decorators/method-by-id"
import { PartialBody } from "../decorators/partial-body"
import { Tournament } from "@frilan/models"
import { RelationsParser } from "../middlewares/relations-parser"
import { Context } from "koa"

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
 *         example: 1
 *       required: true
 *       description: the ID of an existing tournament
 *
 *     TournamentRelations:
 *       name: load
 *       in: query
 *       schema:
 *         type: string
 *         example: event,teams
 *       description: load related resources into response
 */

@JsonController("/events/:event_id(\\d+)/tournaments")
export class EventTournamentController {

    /**
     * @openapi
     * /events/{event-id}/tournaments:
     *   get:
     *     summary: get all tournaments from an event
     *     tags:
     *       - tournaments
     *     parameters:
     *       - $ref: "#/components/parameters/EventId"
     *       - $ref: "#/components/parameters/TournamentRelations"
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
    @UseBefore(RelationsParser)
    readAll(@Param("event_id") eventId: number, @Ctx() ctx: Context): Promise<Tournament[]> {
        return getRepository(Tournament).find({ where: { eventId }, relations: ctx.relations })
    }

    /**
     * @openapi
     * /events/{event-id}/tournaments:
     *   post:
     *     summary: create a new tournament in an event
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
}

@JsonController("/tournaments")
export class TournamentController {

    /**
     * @openapi
     * /tournaments/{tournament-id}:
     *   get:
     *     summary: get a single tournament
     *     tags:
     *       - tournaments
     *     parameters:
     *       - $ref: "#/components/parameters/TournamentId"
     *       - $ref: "#/components/parameters/TournamentRelations"
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
    @UseBefore(RelationsParser)
    read(@Param("id") id: number, @Ctx() ctx: Context): Promise<Tournament | undefined> {
        return getRepository(Tournament).findOne(id, { relations: ctx.relations })
    }

    /**
     * @openapi
     * /tournaments/{tournament-id}:
     *   patch:
     *     summary: update an existing tournament
     *     tags:
     *       - tournaments
     *     parameters:
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
    async update(@Param("id") id: number, @PartialBody() tournament: Tournament): Promise<Tournament | undefined> {
        if (Object.keys(tournament).length)
            await getRepository(Tournament).update(id, tournament)
        return getRepository(Tournament).findOne(id)
    }

    /**
     * @openapi
     * /tournaments/{tournament-id}:
     *   delete:
     *     summary: delete a tournament
     *     tags:
     *       - tournaments
     *     parameters:
     *       - $ref: "#/components/parameters/TournamentId"
     *     responses:
     *       204:
     *         description: tournament deleted
     */
    @DeleteById()
    @OnUndefined(204)
    async delete(@Param("id") id: number): Promise<void> {
        await getRepository(Tournament).delete(id)
    }
}
