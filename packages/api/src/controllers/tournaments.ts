import {
    BadRequestError, Body, Ctx, CurrentUser, ForbiddenError, Get, HttpCode, JsonController, NotFoundError, OnUndefined,
    Param, Post, UseBefore,
} from "routing-controllers"
import { getRepository, Not } from "typeorm"
import { PG_FOREIGN_KEY_VIOLATION } from "@drdgvhbh/postgres-error-codes"
import { DeleteById, GetById, PatchById } from "../decorators/method-by-id"
import { PartialBody } from "../decorators/partial-body"
import { Event, Role, Status, Tournament } from "@frilan/models"
import { RelationsParser } from "../middlewares/relations-parser"
import { Context } from "koa"
import { AuthUser } from "../middlewares/jwt-utils"
import { FiltersParser } from "../middlewares/filters-parser"
import { EventNotFoundError } from "./events"

/**
 * Make sure the tournament is happening during the event.
 */
async function checkDate(eventId: number, tournament: Tournament) {
    const event = await getRepository(Event).findOne(eventId)
    if (!event)
        throw new EventNotFoundError()
    if (tournament.date < event.start || tournament.date > event.end)
        throw new BadRequestError("The tournament must be happening during the event")
}

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
     *       401:
     *         $ref: "#/components/responses/AuthenticationRequired"
     */
    @Get()
    @UseBefore(RelationsParser, FiltersParser)
    async readAll(
        @Param("event_id") eventId: number,
        @CurrentUser({ required: true }) user: AuthUser,
        @Ctx() ctx: Context,
    ): Promise<Tournament[]> {

        // prevent filtering by event ID
        delete ctx.filters.eventId
        // don't show hidden tournaments if not admin/organizer
        if (!user.admin && user.roles[eventId] !== Role.Organizer)
            ctx.filters.status = Not(Status.Hidden)

        return getRepository(Tournament).find({ where: { eventId, ...ctx.filters }, relations: ctx.relations })
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

        await checkDate(eventId, tournament)

        if (tournament.status === Status.Started || tournament.status === Status.Finished)
            throw new BadRequestError("The tournament cannot have already started")

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
        // don't show hidden tournament if not admin/organizer
        if (tournament?.status === Status.Hidden)
            if (!user.admin && user.roles[tournament.eventId] !== Role.Organizer)
                return undefined

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

        await checkDate(tournament.eventId, tournament)

        // check for updated status
        if (updatedTournament.status && updatedTournament.status !== tournament.status) {
            if (updatedTournament.status === Status.Hidden && tournament.status !== Status.Ready)
                throw new BadRequestError("Cannot hide tournament if it has already started")
            if (updatedTournament.status === Status.Ready && tournament.status !== Status.Hidden)
                throw new BadRequestError("Cannot make tournament ready if it has already started")
            if (updatedTournament.status === Status.Started && tournament.status !== Status.Ready)
                throw new BadRequestError("Cannot start tournament if it is not ready")
            if (updatedTournament.status === Status.Finished)
                throw new BadRequestError("Cannot set status to finished before the tournament ended")
        }

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
