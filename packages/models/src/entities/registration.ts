import { Column, Entity, ManyToOne } from "typeorm"
import { Id } from "./common/id"
import { User } from "./user"
import { Event } from "./event"
import { IsDate, IsEnum, IsInt } from "class-validator"
import { Expose, Type } from "class-transformer"

export enum Role {
    Admin = "admin",
    Organizer = "organizer",
    Player = "player"
}

@Entity()
export class Registration extends Id {

    @Column({ type: "enum", enum: Role })
    @IsEnum(Role)
    @Expose()
    role!: Role

    @Column()
    @IsDate()
    @Type(() => Date)
    @Expose()
    arrival!: Date

    @Column()
    @IsDate()
    @Type(() => Date)
    @Expose()
    departure!: Date

    @Column()
    @IsInt()
    @Expose()
    score!: number

    @ManyToOne(() => User)
    user!: User

    @ManyToOne(() => Event)
    event!: Event

}
