import { Column, Entity } from "typeorm"
import { Id } from "./common/id"

@Entity()
export class User extends Id {

    @Column({ unique: true })
    username!: string

    @Column()
    displayName!: string

    @Column({ nullable: true })
    profilePicture?: string

}
