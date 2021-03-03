import { Column, Entity } from "typeorm"
import { Id } from "./common/id"
import { IsOptional, IsString } from "class-validator"

@Entity()
export class User extends Id {

    @Column({ unique: true })
    @IsString()
    username!: string

    @Column()
    @IsString()
    displayName!: string

    @Column({ nullable: true })
    @IsString()
    @IsOptional()
    profilePicture?: string

}
