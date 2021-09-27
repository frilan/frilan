import { Column, Entity, Index, OneToMany } from "typeorm"
import { Id } from "./common/id"
import { IsDate, IsNotEmpty, IsString, Matches } from "class-validator"
import { Trim } from "../decorators/trim"
import { Type } from "class-transformer"
import { Registration } from "./registration"
import { Tournament } from "./tournament"
import { GreaterOrEqual } from "../decorators/greater-or-equal"

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
 *         shortName:
 *           type: string
 *           example: 2022
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
    @IsNotEmpty()
    @Trim()
    name!: string

    @Column()
    @Matches(/^[a-z0-9-]+$/)
    @Index({ unique: true })
    shortName!: string

    @Column()
    @IsDate()
    @Type(() => Date)
    start!: Date

    @Column()
    @IsDate()
    @GreaterOrEqual("start")
    @Type(() => Date)
    end!: Date

    @OneToMany("Registration", "event")
    registrations!: Registration[]

    @OneToMany("Tournament", "event")
    tournaments!: Tournament[]

}
