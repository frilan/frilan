import { BeforeInsert, BeforeUpdate, Entity, PrimaryGeneratedColumn } from "typeorm"
import { validateOrReject } from "class-validator"

@Entity()
export abstract class Id {

    @PrimaryGeneratedColumn()
    id!: number

    @BeforeInsert()
    onCreate(): Promise<void> {
        return validateOrReject(this, { validationError: { target: false } })
    }

    @BeforeUpdate()
    onUpdate(): Promise<void> {
        return validateOrReject(this, { skipMissingProperties: true, validationError: { target: false } })
    }

}
