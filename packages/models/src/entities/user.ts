import { Column, Entity, Index, OneToMany } from "typeorm"
import { Id } from "./common/id"
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from "class-validator"
import { Exclude } from "class-transformer"
import { Trim } from "../decorators/trim"
import { Registration } from "./registration"

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
 *         admin:
 *           type: boolean
 *           example: false
 *
 *     UserWithPassword:
 *       allOf:
 *         - $ref: "#/components/schemas/User"
 *         - type: object
 *           properties:
 *             password:
 *               type: string
 *               example: secret
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
    @MinLength(2)
    @MaxLength(30)
    @IsNotEmpty()
    @Trim()
    username!: string

    @Column()
    @MinLength(6)
    @Exclude({ toPlainOnly: true })
    password!: string

    @Column()
    @MinLength(2)
    @MaxLength(30)
    @IsNotEmpty()
    @Trim()
    displayName!: string

    @Column({ nullable: true })
    @IsString()
    @IsOptional()
    @IsNotEmpty()
    @Trim()
    profilePicture?: string

    @Column({ default: false })
    @IsBoolean()
    @IsOptional()
    admin!: boolean

    @OneToMany("Registration", "user")
    registrations?: Registration[]

}
