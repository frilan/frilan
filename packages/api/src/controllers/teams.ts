import {
    Authorized, BadRequestError, Body, Ctx, CurrentUser, Delete, ForbiddenError, Get, HttpCode, JsonController,
    NotFoundError, OnUndefined, Param, Post, Put, UseBefore,
} from "routing-controllers"
import { getConnection, getRepository } from "typeorm"
import { Registration, Role, Status, Team, Tournament } from "@frilan/models"
import { PartialBody } from "../decorators/partial-body"
import { DeleteById, GetById, PatchById } from "../decorators/method-by-id"
import { RelationsParser } from "../middlewares/relations-parser"
import { Context } from "koa"
import { AuthUser } from "../middlewares/jwt-utils"
import { TournamentNotFoundError } from "./tournaments"
import { FiltersParser } from "../middlewares/filters-parser"

/**
 * Returns true if the user is an organizer of the event in which the team is registered.
 * @param user The authenticated user
 * @param team The target team
 */
export async function isOrganizer(user: AuthUser, team: Team): Promise<boolean> {
    return Boolean(user.roles[team.tournament.eventId] === Role.Organizer)
}

/**
 * Returns all complete teams from a tournament.
 * @param tournament The tournament entity
 */
export async function getFullTeams(tournament: Tournament): Promise<Team[]> {
    return await getRepository(Team)
        .createQueryBuilder("team")
        .where("team.tournamentId = :id", { id: tournament.id })
        .leftJoin("team.members", "members")
        .groupBy("team.id")
        .having("COUNT(members) BETWEEN :min AND :max", {
            min: tournament.teamSizeMin,
            max: tournament.teamSizeMax,
        }).getMany()
}

/**
 * Returns true if a user has already joined a tournament.
 * @param userId The ID of the user
 * @param tournamentId The ID of the tournament
 */
export async function hasAlreadyJoined(userId: number, tournamentId: number): Promise<boolean> {
    return await getRepository(Team)
        .createQueryBuilder("team")
        .leftJoin("team.members", "members")
        .where("team.tournamentId = :tid", { tid: tournamentId })
        .andWhere("members.userId = :uid", { uid: userId })
        .getCount() > 0
}

/**
 * @openapi
 * components:
 *   responses:
 *     TeamNotFound:
 *       description: team not found
 */
export class TeamNotFoundError extends NotFoundError {
    name = "TeamNotFoundError"

    constructor() {
        super("This team does not exist")
    }
}

/**
 * @openapi
 * components:
 *   parameters:
 *     TeamId:
 *       name: team-id
 *       in: path
 *       schema:
 *         type: integer
 *         example: 1
 *       required: true
 *       description: the ID of an existing team
 *
 *     TeamRelations:
 *       name: load
 *       in: query
 *       schema:
 *         type: string
 *         example: tournament,members
 *       description: load related resources into response
 */

@JsonController("/tournaments/:tournament_id(\\d+)/teams")
export class TournamentTeamController {

    /**
     * @openapi
     * /tournaments/{tournament-id}/teams:
     *   get:
     *     summary: get all teams from a tournament
     *     tags:
     *       - teams
     *     parameters:
     *       - $ref: "#/components/parameters/TournamentId"
     *       - $ref: "#/components/parameters/TeamRelations"
     *     responses:
     *       200:
     *         description: success
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: "#/components/schemas/TeamWithId"
     *       401:
     *         $ref: "#/components/responses/AuthenticationRequired"
     *       404:
     *         $ref: "#/components/responses/TournamentNotFound"
     */
    @Get()
    @UseBefore(RelationsParser, FiltersParser)
    @Authorized()
    async readAll(@Param("tournament_id") tournamentId: number, @Ctx() ctx: Context): Promise<Team[]> {
        // prevent filtering by tournament ID
        delete ctx.filters.tournamentId
        return getRepository(Team).find({ where: { tournamentId, ...ctx.filters }, relations: ctx.relations })
    }

    /**
     * @openapi
     * /tournaments/{tournament-id}/teams:
     *   post:
     *     summary: create a new team in a tournament
     *     tags:
     *       - teams
     *     parameters:
     *       - $ref: "#/components/parameters/TournamentId"
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *            $ref: "#/components/schemas/Team"
     *     responses:
     *       201:
     *         description: team created
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/TeamWithId"
     *       400:
     *         $ref: "#/components/responses/ValidationError"
     *       401:
     *         $ref: "#/components/responses/AuthenticationRequired"
     *       403:
     *         $ref: "#/components/responses/NotEnoughPrivilege"
     *       404:
     *         description: the specified event and/or team doesn't exist
     */
    @Post()
    @HttpCode(201)
    async create(
        @Param("tournament_id") tournamentId: number,
        @CurrentUser({ required: true }) user: AuthUser,
        @Body() team: Team,
    ): Promise<Team> {

        const tournament = await getRepository(Tournament).findOne(tournamentId)
        if (!tournament)
            throw new TournamentNotFoundError()

        if (tournament.status === Status.Started || tournament.status === Status.Finished)
            throw new BadRequestError("Cannot add team to tournaments have already started")

        const registration = await getRepository(Registration)
            .findOne({ userId: user.id, eventId: tournament.eventId })

        // by default, the team creator is automatically part of the members
        // however, admins can create teams without being registered to the event
        // if they do so, then it creates an empty team
        if (!registration && !user.admin)
            throw new ForbiddenError("Only users registered to this event can create teams")

        const initialMembers = registration ? [registration] : []

        if (registration && await hasAlreadyJoined(user.id, tournamentId))
            if (user.admin)
                // create empty team if admin already in another team
                initialMembers.pop()
            else
                throw new BadRequestError("Cannot join multiple teams in the same tournament")

        const fullTeams = await getFullTeams(tournament)
        if (fullTeams.length >= tournament.teamCountMax)
            throw new BadRequestError(
                `This tournament is full (max ${ tournament.teamCountMax } teams)`)

        team.tournamentId = tournamentId
        // add current user into the team if registered to the event
        team.members = initialMembers

        const savedTeam = await getRepository(Team).save(team)

        // increment the current number of full teams if needed
        if (initialMembers.length >= tournament.teamSizeMin) {
            ++tournament.teamCount
            await getRepository(Tournament).save(tournament)
        }

        return savedTeam
    }
}

@JsonController("/teams")
export class TeamController {

    /**
     * @openapi
     * /teams/{team-id}:
     *   get:
     *     summary: get a single team
     *     tags:
     *       - teams
     *     parameters:
     *       - $ref: "#/components/parameters/TeamId"
     *       - $ref: "#/components/parameters/TeamRelations"
     *     responses:
     *       200:
     *         description: success
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/TeamWithId"
     *       401:
     *         $ref: "#/components/responses/AuthenticationRequired"
     *       404:
     *         $ref: "#/components/responses/TeamNotFound"
     */
    @GetById()
    @OnUndefined(TeamNotFoundError)
    @UseBefore(RelationsParser)
    @Authorized()
    read(@Param("id") id: number, @Ctx() ctx: Context): Promise<Team | undefined> {
        return getRepository(Team).findOne(id, { relations: ctx.relations })
    }

    /**
     * @openapi
     * /teams/{team-id}:
     *   patch:
     *     summary: update an existing team
     *     tags:
     *       - teams
     *     parameters:
     *       - $ref: "#/components/parameters/TeamId"
     *     requestBody:
     *       content:
     *         application/json:
     *           schema:
     *            $ref: "#/components/schemas/Team"
     *     responses:
     *       200:
     *         description: team updated
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/TeamWithId"
     *       400:
     *         $ref: "#/components/responses/ValidationError"
     *       401:
     *         $ref: "#/components/responses/AuthenticationRequired"
     *       403:
     *         $ref: "#/components/responses/NotEnoughPrivilege"
     *       404:
     *         $ref: "#/components/responses/TeamNotFound"
     */
    @PatchById()
    async update(
        @Param("id") id: number,
        @CurrentUser({ required: true }) user: AuthUser,
        @PartialBody() updatedTeam: Team,
    ): Promise<Team | undefined> {

        const team = await getRepository(Team).findOne({ where: { id }, relations: ["members", "tournament"] })
        if (!team)
            throw new TeamNotFoundError()

        const isMember = team.members.map(({ userId }) => userId).includes(user.id)
        if (!user.admin && !isMember && !await isOrganizer(user, team))
            throw new ForbiddenError("Only members of this team can update the team")

        if (team.tournament.status === Status.Started || team.tournament.status === Status.Finished)
            throw new BadRequestError("Cannot update team if the tournament has already started")

        // assign updated fields and remove relations
        Object.assign(team, { ...updatedTeam, members: undefined, tournament: undefined })
        return await getRepository(Team).save(team)
    }

    /**
     * @openapi
     * /teams/{team-id}:
     *   delete:
     *     summary: delete an existing team
     *     tags:
     *       - teams
     *     parameters:
     *       - $ref: "#/components/parameters/TeamId"
     *     responses:
     *       204:
     *         description: team deleted
     *       400:
     *         description: tournament has already started
     *       401:
     *         $ref: "#/components/responses/AuthenticationRequired"
     *       403:
     *         $ref: "#/components/responses/NotEnoughPrivilege"
     *       404:
     *         $ref: "#/components/responses/TeamNotFound"
     */
    @DeleteById()
    @OnUndefined(204)
    async delete(@Param("id") id: number, @CurrentUser({ required: true }) user: AuthUser): Promise<void> {
        const team = await getRepository(Team).findOne({ where: { id }, relations: ["members", "tournament"] })
        if (!team)
            throw new TeamNotFoundError()

        if (!user.admin && !await isOrganizer(user, team))
            throw new ForbiddenError("Only administrators and organizers can delete teams")

        if (team.tournament.status === Status.Started || team.tournament.status === Status.Finished)
            throw new BadRequestError("Cannot delete team if the tournament has already started")

        await getRepository(Team).delete(id)

        // decrement the number of full teams if needed
        if (team.members.length >= team.tournament.teamSizeMin) {
            --team.tournament.teamCount
            await getRepository(Tournament).save(team.tournament)
        }
    }

    /**
     * @openapi
     * /teams/{team-id}/members:
     *   get:
     *     summary: read members from a team
     *     tags:
     *       - teams
     *     parameters:
     *       - $ref: "#/components/parameters/TeamId"
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
     *       403:
     *         $ref: "#/components/responses/NotEnoughPrivilege"
     *       404:
     *         $ref: "#/components/responses/TeamNotFound"
     */
    @Get("/:id(\\d+)/members")
    @OnUndefined(TeamNotFoundError)
    @UseBefore(RelationsParser)
    @Authorized()
    async readMembers(@Param("id") id: number, @Ctx() ctx: Context): Promise<Registration[] | undefined> {
        const relations = ctx.relations.map((relation: string) => "members." + relation)
        relations.unshift("members")
        const team = await getRepository(Team).findOne(id, { relations })
        return team?.members
    }

    /**
     * @openapi
     * /teams/{team-id}/members/{user-id}:
     *   put:
     *     summary: add a user into a team
     *     tags:
     *       - teams
     *     parameters:
     *       - $ref: "#/components/parameters/TeamId"
     *       - $ref: "#/components/parameters/UserId"
     *     responses:
     *       204:
     *         description: user added into the team
     *       400:
     *         description: user is not registered to event or tournament has already started
     *       401:
     *         $ref: "#/components/responses/AuthenticationRequired"
     *       403:
     *         $ref: "#/components/responses/NotEnoughPrivilege"
     *       404:
     *         $ref: "#/components/responses/TeamNotFound"
     */
    @Put("/:id(\\d+)/members/:user_id(\\d+)")
    @OnUndefined(204)
    async addMember(
        @Param("id") id: number,
        @CurrentUser({ required: true }) user: AuthUser,
        @Param("user_id") userId: number,
    ): Promise<void> {

        const team = await getRepository(Team).findOne(id, { relations: ["members", "tournament"] })
        if (!team)
            throw new TeamNotFoundError()

        if (!user.admin && user.id !== userId && !await isOrganizer(user, team))
            throw new ForbiddenError("Only administrators and organizers can add other users to the team")

        if (team.tournament.status === Status.Started || team.tournament.status === Status.Finished)
            throw new BadRequestError("Cannot add member to the team if the tournament has already started")

        const registration = await getRepository(Registration)
            .findOne({ userId, eventId: team.tournament.eventId })
        if (!registration)
            throw new BadRequestError("Cannot add member that is not registered to the event")

        // skip if member already in team
        if (team.members.some(m => m.eventId === registration.eventId && m.userId === registration.userId))
            return

        if (await hasAlreadyJoined(userId, team.tournamentId))
            throw new BadRequestError("Cannot join multiple teams in the same tournament")

        // check that team and tournament aren't full
        if (team.members.length + 1 > team.tournament.teamSizeMax)
            throw new BadRequestError(
                `This team is full (max ${ team.tournament.teamSizeMax } members)`)

        if (team.members.length + 1 === team.tournament.teamSizeMin) {
            const fullTeams = await getFullTeams(team.tournament)
            if (fullTeams.length >= team.tournament.teamCountMax)
                throw new BadRequestError(
                    `This tournament is full (max ${ team.tournament.teamCountMax } teams)`)

            // increment the number of full teams
            ++team.tournament.teamCount
            await getRepository(Tournament).save(team.tournament)
        }

        // for some reason, members.push(registration) + save(team) doesn't work here
        await getConnection()
            .createQueryBuilder()
            .relation(Team, "members")
            .of(team)
            .add({ userId: registration.userId, eventId: registration.eventId })
    }

    /**
     * @openapi
     * /teams/{team-id}/members/{user-id}:
     *   delete:
     *     summary: remove a user from a team, delete the team if empty afterwards
     *     tags:
     *       - teams
     *     parameters:
     *       - $ref: "#/components/parameters/TeamId"
     *       - $ref: "#/components/parameters/UserId"
     *     responses:
     *       204:
     *         description: user removed from the team
     *       400:
     *         description: tournament has already started
     *       401:
     *         $ref: "#/components/responses/AuthenticationRequired"
     *       403:
     *         $ref: "#/components/responses/NotEnoughPrivilege"
     *       404:
     *         $ref: "#/components/responses/TeamNotFound"
     */
    @Delete("/:id(\\d+)/members/:user_id(\\d+)")
    @OnUndefined(204)
    async removeMember(
        @Param("id") id: number,
        @CurrentUser({ required: true }) user: AuthUser,
        @Param("user_id") userId: number,
    ): Promise<void> {

        const team = await getRepository(Team).findOne(id, { relations: ["members", "tournament"] })
        if (!team)
            throw new TeamNotFoundError()

        if (!user.admin && user.id !== userId && !await isOrganizer(user, team))
            throw new ForbiddenError("Only administrators and organizers can remove other users from the team")

        if (team.tournament.status === Status.Started || team.tournament.status === Status.Finished)
            throw new BadRequestError("Cannot remove member from the team if the tournament has already started")

        const membersLeft = team.members.filter(member => member.userId !== userId)
        if (!membersLeft.length) {
            // also remove team if empty
            await getRepository(Team).delete(id)
        } else
            // for some reason, save(team) doesn't work here
            await getConnection()
                .createQueryBuilder()
                .relation(Team, "members").of(team)
                .remove({ userId, eventId: team.tournament.eventId })

        // decrement the number of full teams if needed
        if (membersLeft.length < team.members.length && team.members.length === team.tournament.teamSizeMin) {
            --team.tournament.teamCount
            await getRepository(Tournament).save(team.tournament)
        }
    }
}
