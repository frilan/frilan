import {
    Body, Delete, Get, HttpCode, HttpError, JsonController, NotFoundError, OnUndefined, Param, Patch, Post,
} from "routing-controllers"
import { getRepository } from "typeorm"
import { PG_UNIQUE_VIOLATION } from "@drdgvhbh/postgres-error-codes"
import { User } from "../entities/user"

export class UserNotFoundError extends NotFoundError {
    name = "UserNotFoundError"

    constructor() {
        super("This user does not exist")
    }
}

export class UserConflictError extends HttpError {
    name = "UserConflictError"

    constructor() {
        super(409, "This username is already taken")
    }
}

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
                throw new UserConflictError()
            else
                throw err
        }
    }

    @Get("/:id")
    @OnUndefined(UserNotFoundError)
    read(@Param("id") id: number): Promise<User | undefined> {
        return getRepository(User).findOne(id)
    }

    @Patch("/:id")
    @OnUndefined(UserNotFoundError)
    async update(@Param("id") id: number, @Body({ validate: { skipMissingProperties: true } }) user: User): Promise<User | undefined> {
        try {
            await getRepository(User).update(id, user)
            return getRepository(User).findOne(id)

        } catch (err) {
            if (err.code == PG_UNIQUE_VIOLATION)
                throw new UserConflictError()
            else
                throw err
        }
    }

    @Delete("/:id")
    @OnUndefined(204)
    async delete(@Param("id") id: number): Promise<void> {
        await getRepository(User).delete(id)
    }
}
