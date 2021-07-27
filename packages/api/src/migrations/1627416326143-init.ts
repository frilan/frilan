import { MigrationInterface, QueryRunner } from "typeorm"

export class init1627416326143 implements MigrationInterface {
    name = "init1627416326143"

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "user"
            (
                "id"             SERIAL            NOT NULL,
                "username"       character varying NOT NULL,
                "password"       character varying NOT NULL,
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
            CREATE TABLE "team"
            (
                "id"           SERIAL            NOT NULL,
                "name"         character varying NOT NULL,
                "result"       integer           NOT NULL DEFAULT '0',
                "tournamentId" integer           NOT NULL,
                CONSTRAINT "PK_f57d8293406df4af348402e4b74" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE TABLE "team_members_user"
            (
                "teamId" integer NOT NULL,
                "userId" integer NOT NULL,
                CONSTRAINT "PK_946e161af78b3cc26186236d3bd" PRIMARY KEY ("teamId", "userId")
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "IDX_b3f2c420a7871621010a4e1d21" ON "team_members_user" ("teamId")
        `)
        await queryRunner.query(`
            CREATE INDEX "IDX_45db1cff3b87cc40512fb2963e" ON "team_members_user" ("userId")
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
        await queryRunner.query(`
            ALTER TABLE "team"
                ADD CONSTRAINT "FK_6c381b833f42438bdf2206f47bd" FOREIGN KEY ("tournamentId") REFERENCES "tournament" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "team_members_user"
                ADD CONSTRAINT "FK_b3f2c420a7871621010a4e1d212" FOREIGN KEY ("teamId") REFERENCES "team" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "team_members_user"
                ADD CONSTRAINT "FK_45db1cff3b87cc40512fb2963ea" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "team_members_user"
                DROP CONSTRAINT "FK_45db1cff3b87cc40512fb2963ea"
        `)
        await queryRunner.query(`
            ALTER TABLE "team_members_user"
                DROP CONSTRAINT "FK_b3f2c420a7871621010a4e1d212"
        `)
        await queryRunner.query(`
            ALTER TABLE "team"
                DROP CONSTRAINT "FK_6c381b833f42438bdf2206f47bd"
        `)
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
            DROP INDEX "IDX_45db1cff3b87cc40512fb2963e"
        `)
        await queryRunner.query(`
            DROP INDEX "IDX_b3f2c420a7871621010a4e1d21"
        `)
        await queryRunner.query(`
            DROP TABLE "team_members_user"
        `)
        await queryRunner.query(`
            DROP TABLE "team"
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
