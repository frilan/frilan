import { Column, Entity, JoinTable, ManyToMany, ManyToOne } from "typeorm"
import { Id } from "./common/id"
import { IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator"
import { Trim } from "../decorators/trim"
import { Tournament } from "./tournament"
import { Registration } from "./registration"
import { ExcludeServerSide } from "../decorators/exclude-server-side"

/**
 * @openapi
 * components:
 *   schemas:
 *     Team:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: My Team
 *         result:
 *           type: number
 *           example: 46
 *         tournamentId:
 *           type: number
 *           example: 12
 *
 *     TeamWithId:
 *       allOf:
 *         - $ref: "#/components/schemas/Id"
 *         - $ref: "#/components/schemas/Team"
 */

@Entity()
export class Team extends Id {

    @Column()
    @IsString()
    @IsNotEmpty()
    @Trim()
    name!: string

    @Column({ default: 0 })
    @IsInt()
    @IsOptional()
    @ExcludeServerSide()
    result!: number

    @Column({ default: 0 })
    @IsOptional()
    @ExcludeServerSide()
    rank!: number

    @Column()
    @ExcludeServerSide()
    tournamentId!: number

    @ManyToOne("Tournament", { onDelete: "CASCADE" })
    tournament?: Tournament

    @ManyToMany("Registration", "teams")
    @JoinTable()
    members?: Registration[]

}
