import { Entity, PrimaryGeneratedColumn } from "typeorm"
import { Exclude, Expose } from "class-transformer"

@Entity()
export abstract class Id {

    @PrimaryGeneratedColumn()
    @Exclude({ toClassOnly: true })
    @Expose()
    id!: number

}
