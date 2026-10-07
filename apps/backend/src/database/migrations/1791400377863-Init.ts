import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1791400377863 implements MigrationInterface {
  name = 'Init1791400377863';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "organizations" (
                "id" uuid NOT NULL,
                "name" character varying(200) NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                CONSTRAINT "pk_organizations" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL,
                "email" character varying(254) NOT NULL,
                "email_key" character varying(254) NOT NULL,
                "name" character varying(200) NOT NULL,
                "password_hash" text NOT NULL,
                "must_change_password" boolean NOT NULL,
                "sessions_valid_after" TIMESTAMP WITH TIME ZONE,
                "version" integer NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                CONSTRAINT "uq_users_email_key" UNIQUE ("email_key"),
                CONSTRAINT "pk_users" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "memberships" (
                "id" uuid NOT NULL,
                "organization_id" uuid NOT NULL,
                "user_id" uuid NOT NULL,
                "role" character varying(20) NOT NULL,
                "version" integer NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "removed_at" TIMESTAMP WITH TIME ZONE,
                "removed_by" uuid,
                CONSTRAINT "ck_memberships_role" CHECK ("role" IN ('MEMBER', 'MANAGER', 'ADMIN')),
                CONSTRAINT "pk_memberships" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "ix_memberships_organization" ON "memberships" ("organization_id", "created_at")
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "uq_memberships_active_user" ON "memberships" ("user_id")
            WHERE "removed_at" IS NULL
        `);
    await queryRunner.query(`
            CREATE TABLE "action_plans" (
                "id" uuid NOT NULL,
                "organization_id" uuid NOT NULL,
                "title" character varying(200) NOT NULL,
                "description" character varying(5000),
                "version" integer NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                CONSTRAINT "uq_action_plans_id_organization" UNIQUE ("id", "organization_id"),
                CONSTRAINT "pk_action_plans" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "ix_action_plans_organization" ON "action_plans" ("organization_id", "created_at")
        `);
    await queryRunner.query(`
            CREATE TABLE "actions" (
                "id" uuid NOT NULL,
                "organization_id" uuid NOT NULL,
                "plan_id" uuid NOT NULL,
                "title" character varying(200) NOT NULL,
                "description" character varying(5000),
                "status" character varying(20) NOT NULL,
                "version" integer NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                "deleted_by" uuid,
                CONSTRAINT "ck_actions_status" CHECK (
                    "status" IN ('TODO', 'IN_PROGRESS', 'TO_VALIDATE', 'DONE')
                ),
                CONSTRAINT "pk_actions" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "ix_actions_plan" ON "actions" ("organization_id", "plan_id", "created_at")
        `);
    await queryRunner.query(`
            CREATE TABLE "action_status_changes" (
                "action_id" uuid NOT NULL,
                "position" integer NOT NULL,
                "from_status" character varying(20) NOT NULL,
                "to_status" character varying(20) NOT NULL,
                "changed_by" uuid NOT NULL,
                "changed_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "reason" text,
                CONSTRAINT "ck_action_status_changes_to" CHECK (
                    "to_status" IN ('TODO', 'IN_PROGRESS', 'TO_VALIDATE', 'DONE')
                ),
                CONSTRAINT "ck_action_status_changes_from" CHECK (
                    "from_status" IN ('TODO', 'IN_PROGRESS', 'TO_VALIDATE', 'DONE')
                ),
                CONSTRAINT "pk_action_status_changes" PRIMARY KEY ("action_id", "position")
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "memberships"
            ADD CONSTRAINT "fk_memberships_organization" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "memberships"
            ADD CONSTRAINT "fk_memberships_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "memberships"
            ADD CONSTRAINT "fk_memberships_removed_by" FOREIGN KEY ("removed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "action_plans"
            ADD CONSTRAINT "fk_action_plans_organization" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "actions"
            ADD CONSTRAINT "fk_actions_plan_same_organization" FOREIGN KEY ("plan_id", "organization_id") REFERENCES "action_plans"("id", "organization_id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "actions"
            ADD CONSTRAINT "fk_actions_deleted_by" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "action_status_changes"
            ADD CONSTRAINT "fk_action_status_changes_action" FOREIGN KEY ("action_id") REFERENCES "actions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "action_status_changes"
            ADD CONSTRAINT "fk_action_status_changes_changed_by" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "action_status_changes" DROP CONSTRAINT "fk_action_status_changes_changed_by"
        `);
    await queryRunner.query(`
            ALTER TABLE "action_status_changes" DROP CONSTRAINT "fk_action_status_changes_action"
        `);
    await queryRunner.query(`
            ALTER TABLE "actions" DROP CONSTRAINT "fk_actions_deleted_by"
        `);
    await queryRunner.query(`
            ALTER TABLE "actions" DROP CONSTRAINT "fk_actions_plan_same_organization"
        `);
    await queryRunner.query(`
            ALTER TABLE "action_plans" DROP CONSTRAINT "fk_action_plans_organization"
        `);
    await queryRunner.query(`
            ALTER TABLE "memberships" DROP CONSTRAINT "fk_memberships_removed_by"
        `);
    await queryRunner.query(`
            ALTER TABLE "memberships" DROP CONSTRAINT "fk_memberships_user"
        `);
    await queryRunner.query(`
            ALTER TABLE "memberships" DROP CONSTRAINT "fk_memberships_organization"
        `);
    await queryRunner.query(`
            DROP TABLE "action_status_changes"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."ix_actions_plan"
        `);
    await queryRunner.query(`
            DROP TABLE "actions"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."ix_action_plans_organization"
        `);
    await queryRunner.query(`
            DROP TABLE "action_plans"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."uq_memberships_active_user"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."ix_memberships_organization"
        `);
    await queryRunner.query(`
            DROP TABLE "memberships"
        `);
    await queryRunner.query(`
            DROP TABLE "users"
        `);
    await queryRunner.query(`
            DROP TABLE "organizations"
        `);
  }
}
