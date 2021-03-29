import { Body, Delete, Get, HttpCode, OnUndefined, Param, Patch, Post } from "routing-controllers"
import { Repository } from "typeorm"
import { PartialBody } from "../../decorators/partial-body"

export class CRUD<Entity> {

    constructor(private repository: Repository<Entity>) {
    }

    @Get()
    readAll(): Promise<Entity[]> {
        return this.repository.find()
    }

    @Post()
    @HttpCode(201)
    create(@Body() entity: Entity): Promise<Entity> {
        return this.repository.save(entity)
    }

    @Get("/:id")
    read(@Param("id") id: number): Promise<Entity | undefined> {
        return this.repository.findOne(id)
    }

    @Patch("/:id")
    async update(@Param("id") id: number, @PartialBody() entity: Entity): Promise<Entity | undefined> {
        // only update if body is not empty
        if (Object.keys(entity).length)
            await this.repository.update(id, entity)

        return this.repository.findOne(id)
    }

    @Delete("/:id")
    @OnUndefined(204)
    async delete(@Param("id") id: number): Promise<void> {
        await this.repository.delete(id)
    }
}
