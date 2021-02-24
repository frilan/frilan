import { Column, Entity, ManyToOne } from "typeorm"
import { Id } from "./common/id"
import { User } from "./user"

export enum Role {
    Admin = "admin",
    Organizer = "organizer",
    Player = "player"
}

@Entity()
export class Registration extends Id {

    @Column({ type: "enum", enum: Role })
    role!: Role

    @Column()
    arrival!: Date

    @Column()
    departure!: Date

    @Column()
    score!: number

    @ManyToOne(() => User)
    user!: User

}
