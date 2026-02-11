import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSummaryColumn1770777433383 implements MigrationInterface {
    name = 'AddSummaryColumn1770777433383'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "analysis_result" ADD "summary" text`);
        await queryRunner.query(`ALTER TABLE "system_config" DROP CONSTRAINT "FK_2bcdaa792424fa92f6cade9d224"`);
        await queryRunner.query(`ALTER TABLE "system_config" ALTER COLUMN "projectId" SET DEFAULT 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'`);
        await queryRunner.query(`ALTER TABLE "system_config" ADD CONSTRAINT "FK_2bcdaa792424fa92f6cade9d224" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "system_config" DROP CONSTRAINT "FK_2bcdaa792424fa92f6cade9d224"`);
        await queryRunner.query(`ALTER TABLE "system_config" ALTER COLUMN "projectId" SET DEFAULT 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'`);
        await queryRunner.query(`ALTER TABLE "system_config" ADD CONSTRAINT "FK_2bcdaa792424fa92f6cade9d224" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "analysis_result" DROP COLUMN "summary"`);
    }

}
