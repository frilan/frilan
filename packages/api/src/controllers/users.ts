import {
    Authorized, BadRequestError, Body, Ctx, CurrentUser, ForbiddenError, Get, HttpCode, HttpError, JsonController,
    NotFoundError, OnUndefined, Param, Post, UseBefore,
} from "routing-controllers"
import { getRepository, Repository, Transaction, TransactionRepository } from "typeorm"
import { PG_UNIQUE_VIOLATION } from "@drdgvhbh/postgres-error-codes"
import { User } from "@frilan/models"
import { PartialBody } from "../decorators/partial-body"
import { DeleteById, GetById, PatchById } from "../decorators/method-by-id"
import { RelationsParser } from "../middlewares/relations-parser"
import { Context } from "koa"
import bcrypt from "bcrypt"
import { AuthUser } from "../middlewares/jwt-utils"
import { FiltersParser } from "../middlewares/filters-parser"
import { isDbError } from "../util/is-db-error"
import { EntityClass, EntityEventType, entitySubscriber } from "../util/entity-subscriber"

/**
 * Hashes the password of the given user, using the bcrypt function.
 * @param user The target user
 */
export async function hashPassword(user: User): Promise<void> {
    if (user.password)
        user.password = await bcrypt.hash(user.password, 10)
}

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
 *   responses:
 *     AdminRemoved:
 *       description: this user is the only administrator and cannot be deleted
 */
export class AdminRemovedError extends ForbiddenError {
    name = "AdminRemovedError"

    constructor() {
        super("This action is forbidden because it would remove the only administrator.")
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
 *         example: 1
 *       required: true
 *       description: the ID of an existing user
 *
 *     UserRelations:
 *       name: load
 *       in: query
 *       schema:
 *         type: string
 *         example: registrations
 *       description: load related resources into response
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
     *     parameters:
     *       - $ref: "#/components/parameters/UserRelations"
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
     *         $ref: "#/components/responses/AuthenticationRequired"
     */
    @Get()
    @UseBefore(RelationsParser, FiltersParser)
    @Authorized()
    readAll(@Ctx() ctx: Context): Promise<User[]> {
        return getRepository(User).find({ relations: ctx.relations, where: ctx.filters })
    }

    /**
     * @openapi
     * /users:
     *   post:
     *     summary: create a new user
     *     tags:
     *       - users
     *     security: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *            $ref: "#/components/schemas/UserWithPassword"
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
        // make the first registered user an admin
        const userCount = await getRepository(User).count()
        user.admin = userCount < 1

        await hashPassword(user)

        try {
            const savedUser = await getRepository(User).save(user)
            entitySubscriber.emit(EntityEventType.Create, EntityClass.User, savedUser)
            return savedUser

        } catch (err) {
            if (isDbError(err) && err.code === PG_UNIQUE_VIOLATION)
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
     *       - $ref: "#/components/parameters/UserRelations"
     *     responses:
     *       200:
     *         description: success
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/UserWithId"
     *       401:
     *         $ref: "#/components/responses/AuthenticationRequired"
     *       404:
     *         $ref: "#/components/responses/UserNotFound"
     */
    @GetById()
    @OnUndefined(UserNotFoundError)
    @UseBefore(RelationsParser)
    @Authorized()
    read(@Param("id") id: number, @Ctx() ctx: Context): Promise<User | undefined> {
        return getRepository(User).findOne(id, { relations: ctx.relations })
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
     *       401:
     *         $ref: "#/components/responses/AuthenticationRequired"
     *       403:
     *         $ref: "#/components/responses/NotEnoughPrivilege"
     *       404:
     *         $ref: "#/components/responses/UserNotFound"
     *       409:
     *         $ref: "#/components/responses/UserConflict"
     */
    @PatchById()
    @OnUndefined(UserNotFoundError)
    async update(
        @Param("id") id: number,
        @CurrentUser({ required: true }) currentUser: AuthUser,
        @PartialBody() updatedUser: User,
    ): Promise<User | undefined> {

        if (!currentUser.admin) {
            if (currentUser.id !== id)
                throw new ForbiddenError("Only administrators can update other users")
            else if ("admin" in updatedUser)
                throw new ForbiddenError("You cannot make yourself an administrator")

        } else if (currentUser.id === id && updatedUser.admin === false) {
            // make sure the last admin doesn't remove their own privileges
            const adminCount = await getRepository(User).count({ admin: true })
            if (adminCount === 1)
                throw new AdminRemovedError()
        }

        await hashPassword(updatedUser)

        try {
            if (Object.keys(updatedUser).length)
                await getRepository(User).update(id, updatedUser)

            const savedUser = await getRepository(User).findOne(id)
            entitySubscriber.emit(EntityEventType.Update, EntityClass.User, savedUser)
            return savedUser

        } catch (err) {
            if (isDbError(err) && err.code === PG_UNIQUE_VIOLATION)
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
     *       401:
     *         $ref: "#/components/responses/AuthenticationRequired"
     *       403:
     *         $ref: "#/components/responses/AdminRemoved"
     */
    @DeleteById()
    @OnUndefined(204)
    @Transaction()
    @Authorized("admin")
    async delete(@Param("id") id: number, @TransactionRepository(User) repository: Repository<User>): Promise<void> {
        const user = await repository.findOne(id, { relations: ["registrations"] })
        if (!user)
            throw new UserNotFoundError()

        if (user.admin) {
            const adminCount = await repository.count({ admin: true })
            if (adminCount === 1)
                throw new AdminRemovedError()
        }

        if (user.registrations.length)
            throw new BadRequestError("Cannot delete this user because they are registered for at least one event")

        await repository.delete(id)
        entitySubscriber.emit(EntityEventType.Delete, EntityClass.User, { ...user, registrations: undefined })
    }
}
