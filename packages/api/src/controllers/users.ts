import { Body, HttpError, JsonController, Param, Patch, Post } from "routing-controllers"
import { getRepository } from "typeorm"
import { PG_UNIQUE_VIOLATION } from "@drdgvhbh/postgres-error-codes"
import { User } from "../entities/user"
import { PartialBody } from "../decorators/partial-body"
import { CRUD } from "./common/crud"

export class UserConflictError extends HttpError {
    name = "UserConflictError"

    constructor() {
        super(409, "This username is already taken")
    }
}

async function handleConflict<T>(next: () => Promise<T>) {
    try {
        return await next()

    } catch (err) {
        if (err.code == PG_UNIQUE_VIOLATION)
            throw new UserConflictError()
        else
            throw err
    }
}

@JsonController("/users")
export class UserController extends CRUD<User> {

    constructor() {
        super(getRepository(User))
    }

    @Post()
    async create(@Body() user: User): Promise<User> {
        return handleConflict(() => super.create(user))
    }

    @Patch("/:id")
    async update(@Param("id") id: number, @PartialBody() user: User): Promise<User | undefined> {
        return handleConflict(() => super.update(id, user))
    }
}
