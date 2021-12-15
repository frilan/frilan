import { IsBoolean, IsEnum, IsInt, IsOptional, Min } from "class-validator"
import { RankList } from "../decorators/rank-list"

/**
 * @openapi
 * components:
 *   schemas:
 *     Ranking:
 *       type: object
 *       properties:
 *         ranks:
 *           type: array
 *           example: [3, 2, [6, 4], [1, 5]]
 *         descOrder:
 *           type: boolean
 *           example: false
 *         points:
 *           type: number
 *           example: 100
 *         distribution:
 *           type: string
 *           enum:
 *             - exponential
 *           example: exponential
 */

export enum Distribution {
    Exponential = "exponential",
}

export class Ranking {

    @RankList()
    ranks!: (number | number[])[]

    @IsOptional()
    @IsBoolean()
    descOrder?: boolean

    @IsInt()
    @Min(0)
    points!: number

    @IsEnum(Distribution)
    distribution!: Distribution

}
