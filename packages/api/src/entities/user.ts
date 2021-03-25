import { Column, Entity, Index } from "typeorm"
import { Id } from "./common/id"
import { IsOptional, IsString } from "class-validator"
import { Trim } from "../decorators/trim"

@Entity()
@Index("username_index", { synchronize: false })
export class User extends Id {

    @Column({ unique: true })
    @IsString()
    @Trim()
    username!: string

    @Column()
    @IsString()
    @Trim()
    displayName!: string

    @Column({ nullable: true })
    @IsString()
    @IsOptional()
    @Trim()
    profilePicture?: string

}
