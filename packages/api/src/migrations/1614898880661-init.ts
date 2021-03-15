import { MigrationInterface, QueryRunner } from "typeorm"

export class init1614898880661 implements MigrationInterface {
    name = "init1614898880661"

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "event"
            (
                "id"   SERIAL            NOT NULL,
                "name" character varying NOT NULL,
                CONSTRAINT "PK_30c2f3bbaf6d34a55f8ae6e4614" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE TABLE "user"
            (
                "id"             SERIAL            NOT NULL,
                "username"       character varying NOT NULL,
                "displayName"    character varying NOT NULL,
                "profilePicture" character varying,
                CONSTRAINT "UQ_78a916df40e02a9deb1c4b75edb" UNIQUE ("username"),
                CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE TYPE "registration_role_enum" AS ENUM('admin', 'organizer', 'player')
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "username_index" ON "user" (LOWER("username"))
        `)
        await queryRunner.query(`
            CREATE TABLE "registration"
            (
                "id"        SERIAL                   NOT NULL,
                "role"      "registration_role_enum" NOT NULL,
                "arrival"   TIMESTAMP                NOT NULL,
                "departure" TIMESTAMP                NOT NULL,
                "score"     integer                  NOT NULL,
                "userId"    integer,
                "eventId"   integer,
                CONSTRAINT "PK_cb23dc9d28df8801b15e9e2b8d6" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "registration"
            ADD CONSTRAINT "FK_af6d07a8391d587c4dd40e7a5a9" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "registration"
                ADD CONSTRAINT "FK_c9cbfae000488578b2bb322c8bd" FOREIGN KEY ("eventId") REFERENCES "event" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "registration"
                DROP CONSTRAINT "FK_c9cbfae000488578b2bb322c8bd"
        `);
        await queryRunner.query(`
            ALTER TABLE "registration"
                DROP CONSTRAINT "FK_af6d07a8391d587c4dd40e7a5a9"
        `);
        await queryRunner.query(`
            DROP TABLE "registration"
        `)
        await queryRunner.query(`
            DROP TYPE "registration_role_enum"
        `)
        await queryRunner.query(`
            DROP TABLE "user"
        `)
        await queryRunner.query(`
            DROP TABLE "event"
        `)
    }

}
