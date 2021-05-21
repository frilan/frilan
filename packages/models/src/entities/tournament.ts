import { Column, Entity, ManyToOne } from "typeorm"
import { Id } from "./common/id"
import { IsDate, IsEnum, IsInt, IsOptional, IsString } from "class-validator"
import { Trim } from "../decorators/trim"
import { Type } from "class-transformer"
import { Event } from "./event"

/**
 * @openapi
 * components:
 *   schemas:
 *     Tournament:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: League Of Legends
 *         date:
 *           type: string
 *           example: 2022-03-12T14:00
 *         duration:
 *           type: number
 *           example: 120
 *         rules:
 *           type: string
 *           example: 5v5 matches, best of 3
 *         team_size_min:
 *           type: number
 *           example: 5
 *         team_size_max:
 *           type: number
 *           example: 6
 *         team_count_min:
 *           type: number
 *           example: 4
 *         team_count_max:
 *           type: number
 *           example: 16
 *         status:
 *           type: string
 *           enum:
 *             - hidden
 *             - ready
 *             - started
 *             - finished
 *           example: ready
 *         eventId:
 *           type: number
 *           example: 3
 *
 *     TournamentWithId:
 *       allOf:
 *         - $ref: "#/components/schemas/Id"
 *         - $ref: "#/components/schemas/Tournament"
 */

export enum Status {
    Hidden = "hidden",
    Ready = "ready",
    Started = "started",
    Finished = "finished"
}

@Entity()
export class Tournament extends Id {

    @Column()
    @IsString()
    @Trim()
    name!: string

    @Column()
    @IsDate()
    @Type(() => Date)
    date!: Date

    @Column()
    @IsInt()
    duration!: number

    @Column({ default: "" })
    @IsString()
    @Trim()
    @IsOptional()
    rules!: string

    @Column()
    @IsInt()
    team_size_min!: number

    @Column()
    @IsInt()
    team_size_max!: number

    @Column()
    @IsInt()
    team_count_min!: number

    @Column()
    @IsInt()
    team_count_max!: number

    @Column({ type: "enum", enum: Status, default: Status.Hidden })
    @IsEnum(Status)
    @IsOptional()
    status!: Status

    @Column()
    eventId!: number

    @ManyToOne(() => Event)
    event!: Event

}
