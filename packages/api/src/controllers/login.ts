import { Ctx, Get, JsonController, UnauthorizedError, UseBefore } from "routing-controllers"
import { Context } from "koa"
import { getRepository } from "typeorm"
import { BasicAuth } from "../middlewares/basic-auth"
import { User, UserAndToken } from "@frilan/models"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import jwtConfig from "../config/jwt"

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
     *               $ref: "#/components/schemas/UserAndToken"
     *
     *       401:
     *         description: wrong username or password
     */
    @Get()
    @UseBefore(BasicAuth)
    async login(@Ctx() ctx: Context): Promise<UserAndToken> {
        const username = ctx.credentials.name
        const user = await getRepository(User)
            .createQueryBuilder("user")
            .leftJoinAndSelect("user.registrations", "registration")
            .leftJoin("registration.event", "event")
            .where("LOWER(username) = LOWER(:username)", { username })
            .getOne()

        if (!user || !await bcrypt.compare(ctx.credentials.pass, user.password))
            throw new UnauthorizedError("Wrong username and/or password")

        // the user's roles during every event they're registered for
        const roles = user.registrations.map(({ eventId, role }) => [eventId, role])

        return {
            user,
            token: jwt.sign({
                id: user.id,
                admin: user.admin,
                roles: Object.fromEntries(roles),
                exp: jwtConfig.expiration(),
            }, jwtConfig.secret),
        }
    }
}
