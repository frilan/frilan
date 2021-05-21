import { MigrationInterface, QueryRunner } from "typeorm"

export class init1621608089481 implements MigrationInterface {
    name = "init1621608089481"

    public async up(queryRunner: QueryRunner): Promise<void> {
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
            CREATE UNIQUE INDEX "username_index" ON "user" (LOWER("username"))
        `)
        await queryRunner.query(`
            CREATE TABLE "event"
            (
                "id"    SERIAL            NOT NULL,
                "name"  character varying NOT NULL,
                "start" TIMESTAMP         NOT NULL,
                "end"   TIMESTAMP         NOT NULL,
                CONSTRAINT "PK_30c2f3bbaf6d34a55f8ae6e4614" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE TYPE "registration_role_enum" AS ENUM('admin', 'organizer', 'player')
        `)
        await queryRunner.query(`
            CREATE TABLE "registration"
            (
                "userId"    integer                  NOT NULL,
                "eventId"   integer                  NOT NULL,
                "role"      "registration_role_enum" NOT NULL DEFAULT 'player',
                "arrival"   TIMESTAMP,
                "departure" TIMESTAMP,
                "score"     integer                  NOT NULL DEFAULT '0',
                CONSTRAINT "PK_c0191cee3b7627583ce4ff300e0" PRIMARY KEY ("userId", "eventId")
            )
        `)
        await queryRunner.query(`
            CREATE TYPE "tournament_status_enum" AS ENUM('hidden', 'ready', 'started', 'finished')
        `)
        await queryRunner.query(`
            CREATE TABLE "tournament"
            (
                "id"             SERIAL                   NOT NULL,
                "name"           character varying        NOT NULL,
                "date"           TIMESTAMP                NOT NULL,
                "duration"       integer                  NOT NULL,
                "rules"          character varying        NOT NULL DEFAULT '',
                "team_size_min"  integer                  NOT NULL,
                "team_size_max"  integer                  NOT NULL,
                "team_count_min" integer                  NOT NULL,
                "team_count_max" integer                  NOT NULL,
                "status"         "tournament_status_enum" NOT NULL DEFAULT 'hidden',
                "eventId"        integer                  NOT NULL,
                CONSTRAINT "PK_449f912ba2b62be003f0c22e767" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            ALTER TABLE "registration"
                ADD CONSTRAINT "FK_af6d07a8391d587c4dd40e7a5a9" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "registration"
                ADD CONSTRAINT "FK_c9cbfae000488578b2bb322c8bd" FOREIGN KEY ("eventId") REFERENCES "event" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "tournament"
                ADD CONSTRAINT "FK_77f8956c8e4f357b0f58d57b5dd" FOREIGN KEY ("eventId") REFERENCES "event" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "tournament"
                DROP CONSTRAINT "FK_77f8956c8e4f357b0f58d57b5dd"
        `)
        await queryRunner.query(`
            ALTER TABLE "registration"
                DROP CONSTRAINT "FK_c9cbfae000488578b2bb322c8bd"
        `)
        await queryRunner.query(`
            ALTER TABLE "registration"
                DROP CONSTRAINT "FK_af6d07a8391d587c4dd40e7a5a9"
        `)
        await queryRunner.query(`
            DROP TABLE "tournament"
        `)
        await queryRunner.query(`
            DROP TYPE "tournament_status_enum"
        `)
        await queryRunner.query(`
            DROP TABLE "registration"
        `)
        await queryRunner.query(`
            DROP TYPE "registration_role_enum"
        `)
        await queryRunner.query(`
            DROP TABLE "event"
        `)
        await queryRunner.query(`
            DROP TABLE "user"
        `)
    }

}
