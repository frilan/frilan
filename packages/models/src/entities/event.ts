import { Column, Entity } from "typeorm"
import { Id } from "./common/id"
import { IsDate, IsString } from "class-validator"
import { Trim } from "../decorators/trim"
import { Type } from "class-transformer"

@Entity()
export class Event extends Id {

    @Column()
    @IsString()
    @Trim()
    name!: string

    @Column()
    @IsDate()
    @Type(() => Date)
    start!: Date

    @Column()
    @IsDate()
    @Type(() => Date)
    end!: Date

}
