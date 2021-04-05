import { Ctx, Get, JsonController, UnauthorizedError, UseBefore } from "routing-controllers"
import { Context } from "koa"
import { getRepository } from "typeorm"
import { BasicAuth } from "../middlewares/basic-auth"
import { User } from "@frilan/models"

@JsonController("/login")
export class LoginController {

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
