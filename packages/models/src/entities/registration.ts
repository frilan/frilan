import { Column, Entity, ManyToMany, ManyToOne, PrimaryColumn } from "typeorm"
import { User } from "./user"
import { Event } from "./event"
import { IsDate, IsEnum, IsOptional } from "class-validator"
import { Type } from "class-transformer"
import { GreaterOrEqual } from "../decorators/greater-or-equal"
import { Team } from "./team"
import { ExcludeServerSide } from "../decorators/exclude-server-side"

/**
 * @openapi
 * components:
 *   schemas:
 *     Registration:
 *       type: object
 *       properties:
 *         role:
 *           type: string
 *           enum:
 *             - organizer
 *             - player
 *           example: player
 *         arrival:
 *           type: string
 *           nullable: true
 *           example: 2022-03-11T17:00
 *         departure:
 *           type: string
 *           nullable: true
 *           example: 2022-03-13T18:00
 *         score:
 *           type: number
 *           example: 678
 *
 *     RegistrationWithIds:
 *       allOf:
 *         - type: object
 *           properties:
 *             userId:
 *               type: number
 *               example: 14
 *             eventId:
 *               type: number
 *               example: 3
 *         - $ref: "#/components/schemas/Registration"
 */

export enum Role {
    Organizer = "organizer",
    Player = "player",
}

@Entity()
export class Registration {

    @PrimaryColumn()
    @ExcludeServerSide()
    userId!: number

    @PrimaryColumn()
    @ExcludeServerSide()
    eventId!: number

    @Column({ type: "enum", enum: Role, default: Role.Player })
    @IsEnum(Role)
    @IsOptional()
    role!: Role

    @Column({ nullable: true })
    @IsDate()
    @IsOptional()
    @Type(() => Date)
    arrival?: Date

    @Column({ nullable: true })
    @IsDate()
    @IsOptional()
    @GreaterOrEqual("arrival")
    @Type(() => Date)
    departure?: Date

    @Column({ default: 0 })
    @ExcludeServerSide()
    score!: number

    @ManyToOne("User", { onDelete: "CASCADE" })
    user!: User

    @ManyToOne("Event", { onDelete: "CASCADE" })
    event!: Event

    @ManyToMany("Team", "members", { onDelete: "CASCADE" })
    teams!: Team[]

}
