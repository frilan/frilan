import { Ctx, Get, JsonController, UnauthorizedError, UseBefore } from "routing-controllers"
import { Context } from "koa"
import { getRepository } from "typeorm"
import { BasicAuth } from "../middlewares/basic-auth"
import { User } from "@frilan/models"

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
     *     summary: sign in to an account
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
     *               type: array
     *               items:
     *                 $ref: "#/components/schemas/UserWithId"
     *       401:
     *         description: wrong username or password
     */
    @Get()
    @UseBefore(BasicAuth)
    async login(@Ctx() ctx: Context): Promise<User> {
        const username = ctx.credentials.name
        const user = await getRepository(User)
            .createQueryBuilder()
            .where("LOWER(username) = LOWER(:username)", { username })
            .getOne()

        if (!user)
            throw new UnauthorizedError("Wrong username and/or password")

        return user
    }
}
