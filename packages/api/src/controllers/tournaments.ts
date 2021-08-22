import {
    Body, Ctx, CurrentUser, ForbiddenError, Get, HttpCode, JsonController, NotFoundError, OnUndefined, Param, Post,
    UseBefore,
} from "routing-controllers"
import { getRepository } from "typeorm"
import { PG_FOREIGN_KEY_VIOLATION } from "@drdgvhbh/postgres-error-codes"
import { DeleteById, GetById, PatchById } from "../decorators/method-by-id"
import { PartialBody } from "../decorators/partial-body"
import { Role, Tournament } from "@frilan/models"
import { RelationsParser } from "../middlewares/relations-parser"
import { Context } from "koa"
import { AuthUser } from "../middlewares/jwt-utils"
import { checkEventPrivilege } from "./events"

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
 * Restrict access to users that are registered to the event hosting the tournament.
 *
 * @param user The authenticated user
 * @param tournament The tournament object or the ID of the tournament
 */
export async function checkTournamentPrivilege(user: AuthUser, tournament: Tournament | number): Promise<void> {
    if (user.admin)
        return

    // if passing an ID as argument
    if (typeof tournament === "number")
        try {
            tournament = await getRepository(Tournament).findOneOrFail(tournament)
        } catch (err) {
            throw new TournamentNotFoundError()
        }

    await checkEventPrivilege(user, tournament.eventId)
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
     *       401:
     *         $ref: "#/components/responses/AuthenticationRequired"
     *       403:
     *         $ref: "#/components/responses/NotEnoughPrivilege"
     */
    @Get()
    @UseBefore(RelationsParser)
    async readAll(
        @Param("event_id") eventId: number,
        @CurrentUser({ required: true }) user: AuthUser,
        @Ctx() ctx: Context,
    ): Promise<Tournament[]> {

        await checkEventPrivilege(user, eventId)
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
     *       401:
     *         $ref: "#/components/responses/AuthenticationRequired"
     *       403:
     *         $ref: "#/components/responses/NotEnoughPrivilege"
     *       404:
     *          description: the specified event doesn't exist
     */
    @Post()
    @HttpCode(201)
    async create(
        @Param("event_id") eventId: number,
        @CurrentUser({ required: true }) user: AuthUser,
        @Body() tournament: Tournament,
    ): Promise<Tournament> {

        if (!user.admin && user.roles[eventId] !== Role.Organizer)
            throw new ForbiddenError("Only administrators and organizers can create tournaments")

        try {
            tournament.eventId = eventId
            return await getRepository(Tournament).save(tournament)
        } catch (err) {
            if (err.code === PG_FOREIGN_KEY_VIOLATION)
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
     *       401:
     *         $ref: "#/components/responses/AuthenticationRequired"
     *       403:
     *         $ref: "#/components/responses/NotEnoughPrivilege"
     *       404:
     *         $ref: "#/components/responses/TournamentNotFound"
     */
    @GetById()
    @OnUndefined(TournamentNotFoundError)
    @UseBefore(RelationsParser)
    async read(
        @Param("id") id: number,
        @CurrentUser({ required: true }) user: AuthUser,
        @Ctx() ctx: Context,
    ): Promise<Tournament | undefined> {

        const tournament = await getRepository(Tournament).findOne(id, { relations: ctx.relations })
        if (tournament)
            await checkTournamentPrivilege(user, tournament)
        return tournament
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
     *       401:
     *         $ref: "#/components/responses/AuthenticationRequired"
     *       403:
     *         $ref: "#/components/responses/NotEnoughPrivilege"
     *       404:
     *         $ref: "#/components/responses/TournamentNotFound"
     */
    @PatchById()
    async update(
        @Param("id") id: number,
        @CurrentUser({ required: true }) user: AuthUser,
        @PartialBody() updatedTournament: Tournament,
    ): Promise<Tournament | undefined> {

        const tournament = await getRepository(Tournament).findOne(id)
        if (!tournament)
            throw new TournamentNotFoundError()

        if (!user.admin && user.roles[tournament.eventId] !== Role.Organizer)
            throw new ForbiddenError("Only administrators and organizers can update tournaments")

        Object.assign(tournament, updatedTournament)
        return await getRepository(Tournament).save(tournament)
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
     *       401:
     *         $ref: "#/components/responses/AuthenticationRequired"
     *       403:
     *         $ref: "#/components/responses/NotEnoughPrivilege"
     */
    @DeleteById()
    @OnUndefined(204)
    async delete(@Param("id") id: number, @CurrentUser({ required: true }) user: AuthUser): Promise<void> {
        if (!user.admin) {
            const tournament = await getRepository(Tournament).findOne(id)
            if (!tournament)
                throw new TournamentNotFoundError()

            if (user.roles[tournament.eventId] !== Role.Organizer)
                throw new ForbiddenError("Only administrators and organizers can delete tournaments")
        }

        await getRepository(Tournament).delete(id)
    }
}
