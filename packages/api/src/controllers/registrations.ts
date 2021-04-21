import {
    BadRequestError, Body, Delete, Get, HttpCode, JsonController, NotFoundError, OnUndefined, Param, Put,
} from "routing-controllers"
import { getRepository } from "typeorm"
import { Registration } from "@frilan/models"
import { PG_FOREIGN_KEY_VIOLATION } from "@drdgvhbh/postgres-error-codes"

export class RegistrationNotFoundError extends NotFoundError {
    name = "RegistrationNotFoundError"

    constructor() {
        super("This registration does not exist")
    }
}

@JsonController("/events/:event_id(\\d+)/registrations")
export class RegistrationController {

    @Get()
    readAll(@Param("event_id") eventId: number): Promise<Registration[]> {
        return getRepository(Registration).find({ where: { eventId } })
    }

    @Put("/:user_id(\\d+)")
    @HttpCode(201)
    async put(
        @Param("event_id") eventId: number,
        @Param("user_id") userId: number,
        @Body() registration: Registration,
    ): Promise<Registration> {
        try {
            registration.eventId = eventId
            registration.userId = userId
            return await getRepository(Registration).save(registration)
        } catch (err) {
            if (err.code == PG_FOREIGN_KEY_VIOLATION)
                throw new BadRequestError(err.detail)
            else
                throw err
        }
    }

    @Get("/:user_id(\\d+)")
    @OnUndefined(RegistrationNotFoundError)
    read(@Param("event_id") eventId: number, @Param("user_id") userId: number): Promise<Registration | undefined> {
        return getRepository(Registration).findOne({ eventId, userId })
    }

    @Delete("/:user_id(\\d+)")
    @OnUndefined(204)
    async delete(@Param("event_id") eventId: number, @Param("user_id") userId: number): Promise<void> {
        await getRepository(Registration).delete({ eventId, userId })
    }
}
