import { Ctx, Get, JsonController, UnauthorizedError, UseBefore } from "routing-controllers"
import { Context } from "koa"
import { getRepository } from "typeorm"
import basicAuth from "../middlewares/basic-auth"
import { User } from "../entities/user"

@JsonController("/login")
export class LoginController {

    @Get()
    @UseBefore(basicAuth)
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
