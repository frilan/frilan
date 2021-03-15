import { Column, Entity, Index } from "typeorm"
import { Id } from "./common/id"
import { IsOptional, IsString } from "class-validator"

@Entity()
@Index("username_index", { synchronize: false })
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
