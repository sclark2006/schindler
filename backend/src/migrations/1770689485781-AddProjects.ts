import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProjects1770689485781 implements MigrationInterface {
    name = 'AddProjects1770689485781'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Create Project Table
        await queryRunner.query(`CREATE TABLE "project" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4d68b1358bb5b766d3e78f32f57" PRIMARY KEY ("id"))`);

        // 2. Insert Default Project
        const defaultProjectId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
        await queryRunner.query(`INSERT INTO "project" ("id", "name", "description") VALUES ('${defaultProjectId}', 'Default Project', 'Legacy Project for existing data')`);

        // 3. System Config
        // Add column allowing NULL first
        await queryRunner.query(`ALTER TABLE "system_config" ADD "projectId" uuid`);
        // Update existing rows
        await queryRunner.query(`UPDATE "system_config" SET "projectId" = '${defaultProjectId}' WHERE "projectId" IS NULL`);
        // Set NOT NULL
        await queryRunner.query(`ALTER TABLE "system_config" ALTER COLUMN "projectId" SET NOT NULL`);
        // Set Default for future inserts (optional, but good if code doesn't supply it yet)
        await queryRunner.query(`ALTER TABLE "system_config" ALTER COLUMN "projectId" SET DEFAULT '${defaultProjectId}'`);

        // Update PK
        await queryRunner.query(`ALTER TABLE "system_config" DROP CONSTRAINT "PK_eedd3cd0f227c7fb5eff2204e93"`);
        await queryRunner.query(`ALTER TABLE "system_config" ADD CONSTRAINT "PK_826002d116b149cf3bec36f7c85" PRIMARY KEY ("key", "projectId")`);

        // 4. Analysis Result
        await queryRunner.query(`ALTER TABLE "analysis_result" ADD "projectId" uuid`);
        await queryRunner.query(`UPDATE "analysis_result" SET "projectId" = '${defaultProjectId}' WHERE "projectId" IS NULL`);

        // 5. Foreign Keys
        await queryRunner.query(`ALTER TABLE "system_config" ADD CONSTRAINT "FK_2bcdaa792424fa92f6cade9d224" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "analysis_result" ADD CONSTRAINT "FK_c78f890980c993a631bed366f45" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "analysis_result" DROP CONSTRAINT "FK_c78f890980c993a631bed366f45"`);
        await queryRunner.query(`ALTER TABLE "system_config" DROP CONSTRAINT "FK_2bcdaa792424fa92f6cade9d224"`);
        await queryRunner.query(`ALTER TABLE "analysis_result" DROP COLUMN "projectId"`);
        await queryRunner.query(`ALTER TABLE "system_config" DROP CONSTRAINT "PK_826002d116b149cf3bec36f7c85"`);
        await queryRunner.query(`ALTER TABLE "system_config" ADD CONSTRAINT "PK_eedd3cd0f227c7fb5eff2204e93" PRIMARY KEY ("key")`);
        await queryRunner.query(`ALTER TABLE "system_config" DROP COLUMN "projectId"`);
        await queryRunner.query(`DROP TABLE "project"`);
    }

}
