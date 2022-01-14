import { Column, Entity, ManyToOne, OneToMany, Unique } from "typeorm"
import { Id } from "./common/id"
import { IsDate, IsEnum, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, Matches, Min } from "class-validator"
import { Trim } from "../decorators/trim"
import { Type } from "class-transformer"
import { Event } from "./event"
import { Team } from "./team"
import { GreaterOrEqual } from "../decorators/greater-or-equal"
import { ExcludeServerSide } from "../decorators/exclude-server-side"
import { Distribution } from "../payloads/ranking"

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
 *         shortName:
 *           type: string
 *           example: lol
 *         date:
 *           type: string
 *           example: 2022-03-12T14:00
 *         duration:
 *           type: number
 *           example: 120
 *         rules:
 *           type: string
 *           example: 5v5 matches, best of 3
 *         teamSizeMin:
 *           type: number
 *           example: 5
 *         teamSizeMax:
 *           type: number
 *           example: 6
 *         teamCountMin:
 *           type: number
 *           example: 4
 *         teamCountMax:
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
    Finished = "finished",
}

@Entity()
@Unique("locator", ["eventId", "shortName"])
export class Tournament extends Id {

    @Column()
    @IsString()
    @IsNotEmpty()
    @Trim()
    name!: string

    @Column()
    @Matches(/^[a-z0-9-]+$/)
    shortName!: string

    @Column()
    @IsDate()
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

    @Column({ nullable: true })
    @IsString()
    @IsOptional()
    @IsNotEmpty()
    @Trim()
    background?: string

    @Column()
    @IsInt()
    @IsPositive()
    teamSizeMin!: number

    @Column()
    @IsInt()
    @IsPositive()
    @GreaterOrEqual("teamSizeMin")
    teamSizeMax!: number

    @Column({ default: 0 })
    @ExcludeServerSide()
    teamCount!: number

    @Column()
    @IsInt()
    @Min(2)
    teamCountMin!: number

    @Column()
    @IsInt()
    @GreaterOrEqual("teamCountMin")
    teamCountMax!: number

    @Column({ type: "enum", enum: Status, default: Status.Hidden })
    @IsEnum(Status)
    @IsOptional()
    status!: Status

    @Column({ default: 100 })
    @ExcludeServerSide()
    pointsPerPlayer!: number

    @Column({ type: "enum", enum: Distribution, default: Distribution.Exponential })
    @ExcludeServerSide()
    pointsDistribution!: Distribution

    @Column()
    @ExcludeServerSide()
    eventId!: number

    @ManyToOne("Event", { onDelete: "CASCADE" })
    event!: Event

    @OneToMany("Team", "tournament")
    teams!: Team[]

}
