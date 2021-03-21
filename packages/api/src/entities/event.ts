import { Column, Entity } from "typeorm"
import { Id } from "./common/id"
import { IsString } from "class-validator"
import { Trim } from "../utils/trim"

@Entity()
export class Event extends Id {

    @Column()
    @IsString()
    @Trim()
    name!: string

}