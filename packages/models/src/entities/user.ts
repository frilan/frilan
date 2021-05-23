import { Column, Entity, Index, ManyToMany, OneToMany } from "typeorm"
import { Id } from "./common/id"
import { IsOptional, IsString } from "class-validator"
import { Trim } from "../decorators/trim"
import { Registration } from "./registration"
import { Team } from "./team"

/**
 * @openapi
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         username:
 *           type: string
 *           example: samuel266
 *         displayName:
 *           type: string
 *           example: Sam
 *         profilePicture:
 *           type: string
 *           nullable: true
 *           example: http://example.com/profile.jpg
 *
 *     UserWithId:
 *       allOf:
 *         - $ref: "#/components/schemas/Id"
 *         - $ref: "#/components/schemas/User"
 */

@Entity()
@Index("username_index", { synchronize: false })
export class User extends Id {

    @Column({ unique: true })
    @IsString()
    @Trim()
    username!: string

    @Column()
    @IsString()
    @Trim()
    displayName!: string

    @Column({ nullable: true })
    @IsString()
    @IsOptional()
    @Trim()
    profilePicture?: string

    @OneToMany(() => Registration, registration => registration.user)
    registrations?: Registration[]

    @ManyToMany(() => Team, team => team.members)
    teams?: Team[]

}
