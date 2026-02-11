import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAiConfigToProject1770771248253 implements MigrationInterface {
    name = 'AddAiConfigToProject1770771248253'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "project" ADD "aiConfig" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "aiConfig"`);
    }

}
