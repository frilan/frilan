import { Column, Entity, Index } from "typeorm"
import { Id } from "./common/id"
import { IsOptional, IsString } from "class-validator"
import { Trim } from "../decorators/trim"
import { Expose } from "class-transformer"

@Entity()
@Index("username_index", { synchronize: false })
export class User extends Id {

    @Column({ unique: true })
    @IsString()
    @Trim()
    @Expose()
    username!: string

    @Column()
    @IsString()
    @Trim()
    @Expose()
    displayName!: string

    @Column({ nullable: true })
    @IsString()
    @IsOptional()
    @Trim()
    @Expose()
    profilePicture?: string

}
