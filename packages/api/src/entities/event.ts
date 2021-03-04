import { Column, Entity } from "typeorm"
import { Id } from "./common/id"
import { IsString } from "class-validator"

@Entity()
export class Event extends Id {

    @Column()
    @IsString()
    name!: string

}
