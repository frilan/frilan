import { Column, Entity, JoinTable, ManyToMany, ManyToOne } from "typeorm"
import { Id } from "./common/id"
import { IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator"
import { Trim } from "../decorators/trim"
import { Tournament } from "./tournament"
import { Exclude } from "class-transformer"
import { Registration } from "./registration"

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
    @Exclude({ toClassOnly: true })
    result!: number

    @Column()
    @Exclude({ toClassOnly: true })
    tournamentId!: number

    @ManyToOne("Tournament", { onDelete: "CASCADE" })
    tournament?: Tournament

    @ManyToMany("Registration", "teams")
    @JoinTable()
    members?: Registration[]

}
