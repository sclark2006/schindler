import { MigrationInterface, QueryRunner } from "typeorm";

export class FixMissingProjectSchema1770690552791 implements MigrationInterface {
    name = 'FixMissingProjectSchema1770690552791'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "system_config" ADD "projectId" uuid NOT NULL DEFAULT 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'`);
        await queryRunner.query(`ALTER TABLE "system_config" DROP CONSTRAINT "PK_eedd3cd0f227c7fb5eff2204e93"`);
        await queryRunner.query(`ALTER TABLE "system_config" ADD CONSTRAINT "PK_826002d116b149cf3bec36f7c85" PRIMARY KEY ("key", "projectId")`);
        await queryRunner.query(`ALTER TABLE "analysis_result" ADD "projectId" uuid`);
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
    }

}
