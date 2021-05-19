import { Column, Entity } from "typeorm"
import { Id } from "./common/id"
import { IsDate, IsString } from "class-validator"
import { Trim } from "../decorators/trim"
import { Type } from "class-transformer"

/**
 * @openapi
 * components:
 *   schemas:
 *     Event:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: FriLAN 2022
 *         start:
 *           type: string
 *           example: 2022-03-11T16:00
 *         end:
 *           type: string
 *           example: 2022-03-13T20:00
 *
 *     EventWithId:
 *       allOf:
 *         - $ref: "#/components/schemas/Id"
 *         - $ref: "#/components/schemas/Event"
 */

@Entity()
export class Event extends Id {

    @Column()
    @IsString()
    @Trim()
    name!: string

    @Column()
    @IsDate()
    @Type(() => Date)
    start!: Date

    @Column()
    @IsDate()
    @Type(() => Date)
    end!: Date

}
