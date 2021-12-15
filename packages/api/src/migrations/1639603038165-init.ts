import { MigrationInterface, QueryRunner } from "typeorm"

export class init1639603038165 implements MigrationInterface {
    name = "init1639603038165"

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "user"
            (
                "id"              SERIAL            NOT NULL,
                "username"        character varying NOT NULL,
                "password"        character varying NOT NULL,
                "display_name"    character varying NOT NULL,
                "profile_picture" character varying,
                "admin"           boolean           NOT NULL DEFAULT false,
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
                "id"         SERIAL            NOT NULL,
                "name"       character varying NOT NULL,
                "short_name" character varying NOT NULL,
                "start"      TIMESTAMP         NOT NULL,
                "end"        TIMESTAMP         NOT NULL,
                CONSTRAINT "PK_30c2f3bbaf6d34a55f8ae6e4614" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_915bba865d833015a56360cde7" ON "event" ("short_name")
        `)
        await queryRunner.query(`
            CREATE TYPE "registration_role_enum" AS ENUM('organizer', 'player')
        `)
        await queryRunner.query(`
            CREATE TABLE "registration"
            (
                "user_id"   integer                  NOT NULL,
                "event_id"  integer                  NOT NULL,
                "role"      "registration_role_enum" NOT NULL DEFAULT 'player',
                "arrival"   TIMESTAMP,
                "departure" TIMESTAMP,
                "score"     integer                  NOT NULL DEFAULT '0',
                CONSTRAINT "PK_1e7f5e56d1849c9166acffd57ef" PRIMARY KEY ("user_id", "event_id")
            )
        `)
        await queryRunner.query(`
            CREATE TYPE "tournament_status_enum" AS ENUM('hidden', 'ready', 'started', 'finished')
        `)
        await queryRunner.query(`
            CREATE TYPE "tournament_points_distribution_enum" AS ENUM('exponential')
        `)
        await queryRunner.query(`
            CREATE TABLE "tournament"
            (
                "id"                  SERIAL                                NOT NULL,
                "name"                character varying                     NOT NULL,
                "short_name"          character varying                     NOT NULL,
                "date"                TIMESTAMP                             NOT NULL,
                "duration"            integer                               NOT NULL,
                "rules"               character varying                     NOT NULL DEFAULT '',
                "background"          character varying,
                "team_size_min"       integer                               NOT NULL,
                "team_size_max"       integer                               NOT NULL,
                "team_count"          integer                               NOT NULL DEFAULT '0',
                "team_count_min"      integer                               NOT NULL,
                "team_count_max"      integer                               NOT NULL,
                "status"              "tournament_status_enum"              NOT NULL DEFAULT 'hidden',
                "points_per_player"   integer                               NOT NULL DEFAULT '100',
                "points_distribution" "tournament_points_distribution_enum" NOT NULL DEFAULT 'exponential',
                "event_id"            integer                               NOT NULL,
                CONSTRAINT "locator" UNIQUE ("event_id", "short_name"),
                CONSTRAINT "PK_449f912ba2b62be003f0c22e767" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE TABLE "team"
            (
                "id"            SERIAL            NOT NULL,
                "name"          character varying NOT NULL,
                "result"        integer           NOT NULL DEFAULT '0',
                "rank"          integer           NOT NULL DEFAULT '0',
                "tournament_id" integer           NOT NULL,
                CONSTRAINT "PK_f57d8293406df4af348402e4b74" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE TABLE "team_members_registration"
            (
                "team_id"               integer NOT NULL,
                "registration_user_id"  integer NOT NULL,
                "registration_event_id" integer NOT NULL,
                CONSTRAINT "PK_b4cb22065b99ee29f9374ec7b06" PRIMARY KEY (
                                                                         "team_id",
                                                                         "registration_user_id",
                                                                         "registration_event_id"
                    )
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "IDX_3ce351a5361dd3d93e89f99d0a" ON "team_members_registration" ("team_id")
        `)
        await queryRunner.query(`
            CREATE INDEX "IDX_f23047e231c19db2e927d422d7" ON "team_members_registration" ("registration_user_id", "registration_event_id")
        `)
        await queryRunner.query(`
            ALTER TABLE "registration"
                ADD CONSTRAINT "FK_7df145ec10b504c38049e3253d4" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "registration"
                ADD CONSTRAINT "FK_e273290b4292fe15ea3b0d03511" FOREIGN KEY ("event_id") REFERENCES "event" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "tournament"
                ADD CONSTRAINT "FK_cb388156628ff0e487babb011b3" FOREIGN KEY ("event_id") REFERENCES "event" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "team"
                ADD CONSTRAINT "FK_f24aaa8a7c9f61441f164b71c86" FOREIGN KEY ("tournament_id") REFERENCES "tournament" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "team_members_registration"
                ADD CONSTRAINT "FK_3ce351a5361dd3d93e89f99d0a1" FOREIGN KEY ("team_id") REFERENCES "team" ("id") ON DELETE CASCADE ON UPDATE CASCADE
        `)
        await queryRunner.query(`
            ALTER TABLE "team_members_registration"
                ADD CONSTRAINT "FK_f23047e231c19db2e927d422d7a" FOREIGN KEY ("registration_user_id", "registration_event_id") REFERENCES "registration" ("user_id", "event_id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "team_members_registration"
                DROP CONSTRAINT "FK_f23047e231c19db2e927d422d7a"
        `)
        await queryRunner.query(`
            ALTER TABLE "team_members_registration"
                DROP CONSTRAINT "FK_3ce351a5361dd3d93e89f99d0a1"
        `)
        await queryRunner.query(`
            ALTER TABLE "team"
                DROP CONSTRAINT "FK_f24aaa8a7c9f61441f164b71c86"
        `)
        await queryRunner.query(`
            ALTER TABLE "tournament"
                DROP CONSTRAINT "FK_cb388156628ff0e487babb011b3"
        `)
        await queryRunner.query(`
            ALTER TABLE "registration"
                DROP CONSTRAINT "FK_e273290b4292fe15ea3b0d03511"
        `)
        await queryRunner.query(`
            ALTER TABLE "registration"
                DROP CONSTRAINT "FK_7df145ec10b504c38049e3253d4"
        `)
        await queryRunner.query(`
            DROP INDEX "IDX_f23047e231c19db2e927d422d7"
        `)
        await queryRunner.query(`
            DROP INDEX "IDX_3ce351a5361dd3d93e89f99d0a"
        `)
        await queryRunner.query(`
            DROP TABLE "team_members_registration"
        `)
        await queryRunner.query(`
            DROP TABLE "team"
        `)
        await queryRunner.query(`
            DROP TABLE "tournament"
        `)
        await queryRunner.query(`
            DROP TYPE "tournament_points_distribution_enum"
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
            DROP INDEX "IDX_915bba865d833015a56360cde7"
        `)
        await queryRunner.query(`
            DROP TABLE "event"
        `)
        await queryRunner.query(`
            DROP TABLE "user"
        `)
    }

}
