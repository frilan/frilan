import {
    Body, Delete, Get, HttpCode, HttpError, JsonController, NotFoundError, OnUndefined, Param, Patch, Post,
} from "routing-controllers"
import { getRepository } from "typeorm"
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity"
import { PG_UNIQUE_VIOLATION } from "@drdgvhbh/postgres-error-codes"
import { User } from "../entities/user"

@JsonController("/users")
export class UserController {

    @Get()
    readAll(): Promise<User[]> {
        return getRepository(User).find()
    }

    @Post()
    @HttpCode(201)
    async create(@Body() user: User): Promise<User> {
        try {
            return await getRepository(User).save(user)

        } catch (err) {
            if (err.code == PG_UNIQUE_VIOLATION)
                throw new HttpError(409, "This user name is already taken")
            else
                throw err
        }
    }

    @Get("/:id")
    async read(@Param("id") id: number): Promise<User> {
        const user = await getRepository(User).findOne(id)
        if (!user)
            throw new NotFoundError("This user does not exist")

        return user
    }

    @Patch("/:id")
    @OnUndefined(204)
    async update(@Param("id") id: number, @Body() user: QueryDeepPartialEntity<User>): Promise<void> {
        await getRepository(User).update(id, user)
    }

    @Delete("/:id")
    @OnUndefined(204)
    async delete(@Param("id") id: number): Promise<void> {
        await getRepository(User).delete(id)
    }
}
