import {
    Body, Get, HttpCode, HttpError, JsonController, NotFoundError, OnUndefined, Param, Post,
} from "routing-controllers"
import { getRepository } from "typeorm"
import { PG_UNIQUE_VIOLATION } from "@drdgvhbh/postgres-error-codes"
import { User } from "@frilan/models"
import { PartialBody } from "../decorators/partial-body"
import { DeleteById, GetById, PatchById } from "../decorators/method-by-id"

/**
 * @openapi
 * components:
 *   responses:
 *     UserNotFound:
 *       description: user not found
 */
export class UserNotFoundError extends NotFoundError {
    name = "UserNotFoundError"

    constructor() {
        super("This user does not exist")
    }
}

/**
 * @openapi
 * components:
 *   responses:
 *     UserConflict:
 *       description: username already taken
 */
export class UserConflictError extends HttpError {
    name = "UserConflictError"

    constructor() {
        super(409, "This username is already taken")
    }
}

/**
 * @openapi
 * components:
 *   parameters:
 *     UserId:
 *       name: user-id
 *       in: path
 *       schema:
 *         type: integer
 *       required: true
 *       description: the ID of an existing user
 */
@JsonController("/users")
export class UserController {

    /**
     * @openapi
     * /users:
     *   get:
     *     summary: get all users
     *     tags:
     *       - users
     *     responses:
     *       200:
     *         description: success
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: "#/components/schemas/UserWithId"
     */
    @Get()
    readAll(): Promise<User[]> {
        return getRepository(User).find()
    }

    /**
     * @openapi
     * /users:
     *   post:
     *     summary: create a new user
     *     tags:
     *       - users
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *            $ref: "#/components/schemas/User"
     *     responses:
     *       201:
     *         description: user created
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/UserWithId"
     *       400:
     *         $ref: "#/components/responses/ValidationError"
     *       409:
     *         $ref: "#/components/responses/UserConflict"
     */
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

    /**
     * @openapi
     * /users/{user-id}:
     *   get:
     *     summary: get a single user
     *     tags:
     *       - users
     *     parameters:
     *       - $ref: "#/components/parameters/UserId"
     *     responses:
     *       200:
     *         description: success
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/UserWithId"
     *       404:
     *         $ref: "#/components/responses/UserNotFound"
     */
    @GetById()
    @OnUndefined(UserNotFoundError)
    read(@Param("id") id: number): Promise<User | undefined> {
        return getRepository(User).findOne(id)
    }

    /**
     * @openapi
     * /users/{user-id}:
     *   patch:
     *     summary: update an existing user
     *     tags:
     *       - users
     *     parameters:
     *       - $ref: "#/components/parameters/UserId"
     *     requestBody:
     *       content:
     *         application/json:
     *           schema:
     *            $ref: "#/components/schemas/User"
     *     responses:
     *       200:
     *         description: user updated
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/UserWithId"
     *       400:
     *         $ref: "#/components/responses/ValidationError"
     *       404:
     *         $ref: "#/components/responses/UserNotFound"
     *       409:
     *         $ref: "#/components/responses/UserConflict"
     */
    @PatchById()
    @OnUndefined(UserNotFoundError)
    async update(@Param("id") id: number, @PartialBody() user: User): Promise<User | undefined> {
        try {
            if (Object.keys(user).length)
                await getRepository(User).update(id, user)
            return getRepository(User).findOne(id)

        } catch (err) {
            if (err.code == PG_UNIQUE_VIOLATION)
                throw new UserConflictError()
            else
                throw err
        }
    }

    /**
     * @openapi
     * /users/{user-id}:
     *   delete:
     *     summary: delete an existing user
     *     tags:
     *       - users
     *     parameters:
     *       - $ref: "#/components/parameters/UserId"
     *     responses:
     *       204:
     *         description: user deleted
     */
    @DeleteById()
    @OnUndefined(204)
    async delete(@Param("id") id: number): Promise<void> {
        await getRepository(User).delete(id)
    }
}
