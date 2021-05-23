import {
    Body, Ctx, Delete, Get, HttpCode, JsonController, NotFoundError, OnUndefined, Param, Post, Put, UseBefore,
} from "routing-controllers"
import { getRepository } from "typeorm"
import { Team, User } from "@frilan/models"
import { PartialBody } from "../decorators/partial-body"
import { DeleteById, GetById, PatchById } from "../decorators/method-by-id"
import { PG_FOREIGN_KEY_VIOLATION } from "@drdgvhbh/postgres-error-codes"
import { UserNotFoundError } from "./users"
import { RelationsParser } from "../middlewares/relations-parser"
import { Context } from "koa"

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
 *       required: true
 *       description: the ID of an existing team
 *
 *     TeamRelations:
 *       name: load
 *       in: query
 *       schema:
 *         type: string
 *         example: user,event
 *       description: load related resources into response
 */
@JsonController("/events/:event_id(\\d+)/tournaments/:tournament_id(\\d+)/teams")
export class TeamController {

    /**
     * @openapi
     * /events/{event-id}/tournaments/{tournament-id}/teams:
     *   get:
     *     summary: get all teams
     *     tags:
     *       - teams
     *     parameters:
     *       - $ref: "#/components/parameters/EventId"
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
     */
    @Get()
    @UseBefore(RelationsParser)
    readAll(@Param("tournament_id") tournamentId: number, @Ctx() ctx: Context): Promise<Team[]> {
        return getRepository(Team).find({ where: { tournamentId }, relations: ctx.relations })
    }

    /**
     * @openapi
     * /events/{event-id}/tournaments/{tournament-id}/teams:
     *   post:
     *     summary: create a new team
     *     tags:
     *       - teams
     *     parameters:
     *       - $ref: "#/components/parameters/EventId"
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
     *       404:
     *          description: the specified event and/or team doesn't exist
     */
    @Post()
    @HttpCode(201)
    async create(@Param("tournament_id") tournamentId: number, @Body() team: Team): Promise<Team> {
        try {
            team.tournamentId = tournamentId
            return await getRepository(Team).save(team)
        } catch (err) {
            if (err.code == PG_FOREIGN_KEY_VIOLATION)
                throw new NotFoundError(err.detail)
            else
                throw err
        }
    }

    /**
     * @openapi
     * /events/{event-id}/tournaments/{tournament-id}/teams/{team-id}:
     *   get:
     *     summary: get a single team
     *     tags:
     *       - teams
     *     parameters:
     *       - $ref: "#/components/parameters/EventId"
     *       - $ref: "#/components/parameters/TournamentId"
     *       - $ref: "#/components/parameters/TeamId"
     *       - $ref: "#/components/parameters/TeamRelations"
     *     responses:
     *       200:
     *         description: success
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/TeamWithId"
     *       404:
     *         $ref: "#/components/responses/TeamNotFound"
     */
    @GetById()
    @OnUndefined(TeamNotFoundError)
    @UseBefore(RelationsParser)
    read(
        @Param("tournament_id") tournamentId: number,
        @Param("id") id: number,
        @Ctx() ctx: Context,
    ): Promise<Team | undefined> {
        return getRepository(Team).findOne({ id, tournamentId }, { relations: ctx.relations })
    }

    /**
     * @openapi
     * /events/{event-id}/tournaments/{tournament-id}/teams/{team-id}:
     *   patch:
     *     summary: update an existing team
     *     tags:
     *       - teams
     *     parameters:
     *       - $ref: "#/components/parameters/EventId"
     *       - $ref: "#/components/parameters/TournamentId"
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
     *       404:
     *         $ref: "#/components/responses/TeamNotFound"
     */
    @PatchById()
    @OnUndefined(TeamNotFoundError)
    async update(
        @Param("tournament_id") tournamentId: number,
        @Param("id") id: number,
        @PartialBody() team: Team,
    ): Promise<Team | undefined> {
        if (Object.keys(team).length)
            await getRepository(Team).update({ id, tournamentId }, team)
        return getRepository(Team).findOne(id)
    }

    /**
     * @openapi
     * /events/{event-id}/tournaments/{tournament-id}/teams/{team-id}:
     *   delete:
     *     summary: delete an existing team
     *     tags:
     *       - teams
     *     parameters:
     *       - $ref: "#/components/parameters/EventId"
     *       - $ref: "#/components/parameters/TournamentId"
     *       - $ref: "#/components/parameters/TeamId"
     *     responses:
     *       204:
     *         description: team deleted
     */
    @DeleteById()
    @OnUndefined(204)
    async delete(@Param("tournament_id") tournamentId: number, @Param("id") id: number): Promise<void> {
        await getRepository(Team).delete({ id, tournamentId })
    }

    /**
     * @openapi
     * /events/{event-id}/tournaments/{tournament-id}/teams/{team-id}/members/{user-id}:
     *   put:
     *     summary: add a user into a team
     *     tags:
     *       - teams
     *     parameters:
     *       - $ref: "#/components/parameters/EventId"
     *       - $ref: "#/components/parameters/TournamentId"
     *       - $ref: "#/components/parameters/TeamId"
     *       - $ref: "#/components/parameters/UserId"
     *     responses:
     *       204:
     *         description: user added into the team
     *       404:
     *         description: team and/or user not found
     */
    @Put("/:id(\\d+)/members/:user_id(\\d+)")
    @OnUndefined(204)
    async addPlayer(
        @Param("tournament_id") tournamentId: number,
        @Param("id") id: number,
        @Param("user_id") userId: number,
    ): Promise<void> {
        const team = await getRepository(Team).findOne({ id, tournamentId }, { relations: ["members"] })
        if (!team)
            throw new TeamNotFoundError()

        const user = await getRepository(User).findOne(userId)
        if (!user)
            throw new UserNotFoundError()

        team.members?.push(user)
        await getRepository(Team).save(team)
    }

    /**
     * @openapi
     * /events/{event-id}/tournaments/{tournament-id}/teams/{team-id}/members/{user-id}:
     *   delete:
     *     summary: remove a user from a team
     *     tags:
     *       - teams
     *     parameters:
     *       - $ref: "#/components/parameters/EventId"
     *       - $ref: "#/components/parameters/TournamentId"
     *       - $ref: "#/components/parameters/TeamId"
     *       - $ref: "#/components/parameters/UserId"
     *     responses:
     *       204:
     *         description: user removed from the team
     *       404:
     *         $ref: "#/components/responses/TeamNotFound"
     */
    @Delete("/:id(\\d+)/members/:user_id(\\d+)")
    @OnUndefined(204)
    async removePlayer(
        @Param("tournament_id") tournamentId: number,
        @Param("id") id: number,
        @Param("user_id") userId: number,
    ): Promise<void> {
        const team = await getRepository(Team).findOne({ id, tournamentId }, { relations: ["members"] })
        if (!team)
            throw new TeamNotFoundError()

        team.members = team.members?.filter(({ id }) => id != userId)
        await getRepository(Team).save(team)
    }
}
