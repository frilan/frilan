import { Column, Entity } from "typeorm"
import { Id } from "./common/id"
import { IsString } from "class-validator"
import { Trim } from "../decorators/trim"
import { Expose } from "class-transformer"

@Entity()
export class Event extends Id {

    @Column()
    @IsString()
    @Trim()
    @Expose()
    name!: string

}
