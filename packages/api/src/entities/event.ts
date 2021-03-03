import { Column, Entity, ManyToOne } from "typeorm"
import { Id } from "./common/id"
import { Registration } from "./registration"
import { IsString } from "class-validator"

@Entity()
export class Event extends Id {

    @Column()
    @IsString()
    name!: string

    @ManyToOne(() => Registration)
    registration!: Registration

}
