import { Column, Entity } from "typeorm"
import { Id } from "./common/id"
import { IsDate, IsString } from "class-validator"
import { Trim } from "../decorators/trim"
import { Expose, Type } from "class-transformer"

@Entity()
export class Event extends Id {

    @Column()
    @IsString()
    @Trim()
    @Expose()
    name!: string

    @Column()
    @IsDate()
    @Type(() => Date)
    @Expose()
    start!: Date

    @Column()
    @IsDate()
    @Type(() => Date)
    @Expose()
    end!: Date

}
