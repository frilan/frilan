import { Column, Entity, ManyToOne } from "typeorm"
import { Id } from "./common/id"
import { Registration } from "./registration"

@Entity()
export class Event extends Id {

    @Column()
    name!: string

    @ManyToOne(() => Registration)
    registration!: Registration

}
