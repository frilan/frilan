import { Ctx, Get, InternalServerError, JsonController, UnauthorizedError, UseBefore } from "routing-controllers"
import { Context } from "koa"
import { getRepository } from "typeorm"
import { BasicAuth } from "../middlewares/basic-auth"
import { User } from "@frilan/models"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

/**
 * @openapi
 * components:
 *   securitySchemes:
 *     BasicAuth:
 *       type: http
 *       scheme: basic
 */

@JsonController("/login")
export class LoginController {

    /**
     * @openapi
     * /login:
     *   get:
     *     summary: sign in to an account and get a JSON Web Token
     *     tags:
     *       - authentication
     *     security:
     *       - BasicAuth: []
     *     responses:
     *       200:
     *         description: success
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 user:
     *                   $ref: "#/components/schemas/UserWithId"
     *                 token:
     *                   type: string
     *
     *       401:
     *         description: wrong username or password
     */
    @Get()
    @UseBefore(BasicAuth)
    async login(@Ctx() ctx: Context): Promise<{ user: User, token: string }> {
        const username = ctx.credentials.name
        const user = await getRepository(User)
            .createQueryBuilder("user")
            .leftJoinAndSelect("user.registrations", "registration")
            .leftJoin("registration.event", "event")
            .where("LOWER(username) = LOWER(:username)", { username })
            .getOne()

        if (!user || !await bcrypt.compare(ctx.credentials.pass, user.password))
            throw new UnauthorizedError("Wrong username and/or password")

        if (process.env.JWT_SECRET === undefined)
            throw new InternalServerError("JWT secret not set")

        // the user's roles during every event they're registered to
        const roles = user.registrations?.map(({ eventId, role }) => [eventId, role])

        const timeToLive = Number(process.env.JWT_TTL || 3600)
        return {
            user,
            token: jwt.sign({
                id: user.id,
                admin: user.admin,
                roles: Object.fromEntries(roles || []),
                exp: Math.floor(Date.now() / 1000) + timeToLive,
            }, process.env.JWT_SECRET),
        }
    }
}
