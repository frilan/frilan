import { Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity()
export abstract class Id {

    @PrimaryGeneratedColumn()
    id!: number

}
