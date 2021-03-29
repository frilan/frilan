import { Entity, PrimaryGeneratedColumn } from "typeorm"
import { Exclude } from "class-transformer"

@Entity()
export abstract class Id {

    @PrimaryGeneratedColumn()
    @Exclude({ toClassOnly: true })
    id!: number

}
