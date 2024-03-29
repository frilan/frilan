import {
    BadRequestError, Body, Ctx, CurrentUser, ForbiddenError, Get, HttpCode, HttpError, JsonController, NotFoundError,
    OnNull, OnUndefined, Param, Post, Put, UseBefore,
} from "routing-controllers"
import { In, Not } from "typeorm"
import { PG_FOREIGN_KEY_VIOLATION, PG_UNIQUE_VIOLATION } from "@drdgvhbh/postgres-error-codes"
import { DeleteById, GetById, PatchById } from "../decorators/method-by-id"
import { PartialBody } from "../decorators/partial-body"
import { Distribution, Event, Ranking, Registration, Role, Status, Team, Tournament } from "@frilan/models"
import { RelationsParser } from "../middlewares/relations-parser"
import { Context } from "koa"
import { AuthUser } from "../middlewares/jwt-utils"
import { FiltersParser } from "../middlewares/filters-parser"
import { EventNotFoundError } from "./events"
import { distributeExp } from "../util/points-distribution"
import { getFullTeams } from "./teams"
import { isDbError } from "../util/is-db-error"
import { EntityClass, EntityEventType, entitySubscriber } from "../util/entity-subscriber"
import db from "../config/db"

const repository = db.getRepository(Tournament)

/**
 * Make sure the tournament is happening during the event.
 */
async function checkDate(eventId: number, tournament: Tournament) {
    const event = await db.getRepository(Event).findOneBy({ id: eventId })
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
 *   responses:
 *     TournamentConflict:
 *       description: short name already taken
 */
export class TournamentConflictError extends HttpError {
    name = "TournamentConflictError"

    constructor() {
        super(409, "A tournament with this short name already exists in this event")
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

        return repository.find({ where: { eventId, ...ctx.filters }, relations: ctx.relations })
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
     *             $ref: "#/components/schemas/Tournament"
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
     *         description: the specified event doesn't exist
     *       409:
     *         $ref: "#/components/responses/TournamentConflict"
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
            const savedTournament = await repository.save(tournament)
            entitySubscriber.emit(EntityEventType.Create, EntityClass.Tournament, savedTournament)
            return savedTournament

        } catch (err) {
            if (isDbError(err) && err.code === PG_FOREIGN_KEY_VIOLATION)
                throw new NotFoundError(err.detail)
            if (isDbError(err) && err.code === PG_UNIQUE_VIOLATION)
                throw new TournamentConflictError()
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
    @OnNull(TournamentNotFoundError)
    @UseBefore(RelationsParser)
    async read(
        @Param("id") id: number,
        @CurrentUser({ required: true }) user: AuthUser,
        @Ctx() ctx: Context,
    ): Promise<Tournament | null> {

        const tournament = await repository.findOne({ where: { id }, relations: ctx.relations })
        // don't show hidden tournament if not admin/organizer
        if (tournament?.status === Status.Hidden)
            if (!user.admin && user.roles[tournament.eventId] !== Role.Organizer)
                return null

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
     *             $ref: "#/components/schemas/Tournament"
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

        const tournament = await repository.findOneBy({ id })
        if (!tournament)
            throw new TournamentNotFoundError()

        if (!user.admin && user.roles[tournament.eventId] !== Role.Organizer)
            throw new ForbiddenError("Only administrators and organizers can update tournaments")

        await checkDate(tournament.eventId, updatedTournament)

        // check for updated status
        if (updatedTournament.status && updatedTournament.status !== tournament.status) {
            if (updatedTournament.status === Status.Hidden && tournament.status !== Status.Ready)
                throw new BadRequestError("Cannot hide tournament if it has already started")
            if (updatedTournament.status === Status.Ready && tournament.status !== Status.Hidden)
                throw new BadRequestError("Cannot make tournament ready if it has already started")
            if (updatedTournament.status === Status.Finished)
                throw new BadRequestError("Cannot set status to finished before the tournament ended")

            if (updatedTournament.status === Status.Started) {
                if (tournament.status !== Status.Ready)
                    throw new BadRequestError("Cannot start tournament if it is not ready")

                // get all complete teams
                const fullTeams = await getFullTeams(tournament)
                if (fullTeams.length < tournament.teamCountMin)
                    throw new BadRequestError(
                        `Cannot start tournament without at least ${ tournament.teamCountMin } complete teams`)
                if (fullTeams.length > tournament.teamCountMax)
                    throw new BadRequestError(
                        `Cannot start tournament with more than ${ tournament.teamCountMin } complete teams`)

                // delete teams that are incomplete
                await db.getRepository(Team).delete({
                    id: Not(In(fullTeams.map(({ id }) => id))),
                    tournamentId: tournament.id,
                })
            }
        }

        Object.assign(tournament, updatedTournament)

        // update number of full teams if needed
        if ("teamSizeMin" in updatedTournament || "teamSizeMax" in updatedTournament) {
            const fullTeams = await getFullTeams(tournament)
            tournament.teamCount = fullTeams.length
        }

        try {
            const savedTournament = await repository.save(tournament)
            entitySubscriber.emit(EntityEventType.Update, EntityClass.Tournament, savedTournament)
            return savedTournament

        } catch (err) {
            if (isDbError(err) && err.code === PG_UNIQUE_VIOLATION)
                throw new TournamentConflictError()
            else
                throw err
        }
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
        const tournament = await repository.findOneBy({ id })
        if (!tournament)
            throw new TournamentNotFoundError()

        if (!user.admin && user.roles[tournament.eventId] !== Role.Organizer)
            throw new ForbiddenError("Only administrators and organizers can delete tournaments")

        if (tournament.status === Status.Started || tournament.status === Status.Finished)
            throw new BadRequestError("Cannot delete this tournament because it has already started")

        await repository.delete(id)

        entitySubscriber.emit(EntityEventType.Delete, EntityClass.Tournament, { id }, tournament)
    }

    /**
     * @openapi
     * /tournaments/{tournament-id}/results:
     *   put:
     *     summary: end a running tournament and provide the ranking
     *     tags:
     *       - tournaments
     *     parameters:
     *       - $ref: "#/components/parameters/TournamentId"
     *     requestBody:
     *       content:
     *         application/json:
     *           schema:
     *             $ref: "#/components/schemas/Ranking"
     *     responses:
     *       200:
     *         description: tournament ended and scores updated
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
     *         $ref: "#/components/responses/TournamentNotFound"
     */
    @Put("/:tournament_id(\\d+)/results")
    async end(
        @Param("tournament_id") id: number,
        @CurrentUser({ required: true }) user: AuthUser,
        @Body() ranking: Ranking,
    ): Promise<Tournament> {

        const tournament = await repository.findOne({ where: { id }, relations: ["teams", "teams.members"] })
        if (!tournament)
            throw new TournamentNotFoundError()

        if (!user.admin && user.roles[tournament.eventId] !== Role.Organizer)
            throw new ForbiddenError("Only administrators and organizers can end tournaments")

        if (tournament.status !== Status.Started && tournament.status !== Status.Finished)
            throw new BadRequestError("Cannot end a tournament that hasn't started")

        if (ranking.ranks.length > tournament.teams.length)
            throw new BadRequestError("Too many teams in ranking")

        // check that every team has received a rank
        const missing = tournament.teams.filter(({ id }) => !ranking.ranks.flat().includes(id))
        if (missing.length)
            throw new BadRequestError(`Missing team(s) in ranking: [${ missing.map(t => t.id).join(", ") }]`)

        if (ranking.descOrder)
            ranking.ranks.reverse()

        // ranking algorithm
        let trueRank = 1
        for (const ids of ranking.ranks) {
            const tiedTeams = Array.isArray(ids) ? ids : [ids]

            let result = 0
            if (ranking.distribution === Distribution.Exponential)
                result = distributeExp(trueRank, tiedTeams.length, tournament.teams.length, ranking.points)
            else
                throw new BadRequestError("Invalid points distribution")

            // update team entities
            for (const id of tiedTeams) {
                const team = tournament.teams.find(team => team.id === id)
                if (!team)
                    throw new BadRequestError(`Team ${ team } is not registered for this tournament`)

                // needed if results are being updated
                const prevResult = team.result

                team.rank = trueRank
                team.result = result

                const { members, ...teamWithoutMembers } = team

                // adjust members scores
                for (const member of members)
                    member.score += result - prevResult
                await db.getRepository(Registration).save(members)

                for (const member of members)
                    entitySubscriber.emit(EntityEventType.Update, EntityClass.Registration, member)

                // for some reason, save(team) fails if it contains members
                await db.getRepository(Team).save(teamWithoutMembers)
                entitySubscriber.emit(EntityEventType.Update, EntityClass.Team, team)
            }

            trueRank += tiedTeams.length
        }

        tournament.status = Status.Finished
        tournament.pointsPerPlayer = ranking.points
        tournament.pointsDistribution = ranking.distribution
        await repository.save(tournament)

        entitySubscriber.emit(EntityEventType.Update, EntityClass.Tournament, { ...tournament, teams: undefined })
        return tournament
    }
}
