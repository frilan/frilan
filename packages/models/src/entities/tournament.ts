import { Column, Entity, ManyToOne, OneToMany } from "typeorm"
import { Id } from "./common/id"
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, Min } from "class-validator"
import { Trim } from "../decorators/trim"
import { Type } from "class-transformer"
import { Event } from "./event"
import { Team } from "./team"
import { GreaterOrEqual } from "../decorators/greater-or-equal"
import { ExcludeServerSide } from "../decorators/exclude-server-side"

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
    @IsNotEmpty()
    @Trim()
    name!: string

    @Column()
    @Type(() => Date)
    date!: Date

    @Column()
    @IsPositive()
    duration!: number

    @Column({ default: "" })
    @IsString()
    @Trim()
    @IsOptional()
    rules!: string

    @Column()
    @IsInt()
    @IsPositive()
    team_size_min!: number

    @Column()
    @IsInt()
    @IsPositive()
    @GreaterOrEqual("team_size_min")
    team_size_max!: number

    @Column()
    @IsInt()
    @Min(2)
    team_count_min!: number

    @Column()
    @IsInt()
    @GreaterOrEqual("team_count_min")
    team_count_max!: number

    @Column({ type: "enum", enum: Status, default: Status.Hidden })
    @IsEnum(Status)
    @IsOptional()
    status!: Status

    @Column()
    @ExcludeServerSide()
    eventId!: number

    @ManyToOne("Event", { onDelete: "CASCADE" })
    event?: Event

    @OneToMany("Team", "tournament")
    teams?: Team[]

}
