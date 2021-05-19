import { Entity, PrimaryGeneratedColumn } from "typeorm"
import { Exclude } from "class-transformer"

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
    @Exclude({ toClassOnly: true })
    id!: number

}
