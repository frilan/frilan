import { Column, Entity, ManyToOne, PrimaryColumn } from "typeorm"
import { User } from "./user"
import { Event } from "./event"
import { IsDate, IsEnum, IsInt, IsOptional } from "class-validator"
import { Type } from "class-transformer"

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
 *             - admin
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
    Admin = "admin",
    Organizer = "organizer",
    Player = "player"
}

@Entity()
export class Registration {

    @PrimaryColumn()
    userId!: number

    @PrimaryColumn()
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
    @Type(() => Date)
    departure?: Date

    @Column({ default: 0 })
    @IsInt()
    @IsOptional()
    score!: number

    @ManyToOne(() => User)
    user?: User

    @ManyToOne(() => Event)
    event?: Event

}
