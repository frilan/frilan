import { Column, Entity, ManyToOne } from "typeorm"
import { Id } from "./common/id"
import { User } from "./user"
import { Event } from "./event"
import { IsDate, IsEnum, IsInt } from "class-validator"

export enum Role {
    Admin = "admin",
    Organizer = "organizer",
    Player = "player"
}

@Entity()
export class Registration extends Id {

    @Column({ type: "enum", enum: Role })
    @IsEnum(Role)
    role!: Role

    @Column()
    @IsDate()
    arrival!: Date

    @Column()
    @IsDate()
    departure!: Date

    @Column()
    @IsInt()
    score!: number

    @ManyToOne(() => User)
    user!: User

    @ManyToOne(() => Event)
    event!: Event

}
