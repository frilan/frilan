import { Entity, PrimaryGeneratedColumn } from "typeorm"
import { ExcludeServerSide } from "../../decorators/exclude-server-side"

/**
 * @openapi
 * components:
 *   schemas:
 *     Id:
 *       type: object
 *       properties:
 *         id:
 *           type: number
 *           example: 37
 */

@Entity()
export abstract class Id {

    @PrimaryGeneratedColumn()
    @ExcludeServerSide()
    id!: number

}
