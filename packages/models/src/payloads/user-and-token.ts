import { User } from "../entities/user"
import { Type } from "class-transformer"

/**
 * @openapi
 * components:
 *   schemas:
 *     UserAndToken:
 *       type: object
 *       properties:
 *         user:
 *           $ref: "#/components/schemas/UserWithId"
 *         token:
 *           type: string
 */

export class UserAndToken {

    @Type(() => User)
    user!: User

    token!: string

}
