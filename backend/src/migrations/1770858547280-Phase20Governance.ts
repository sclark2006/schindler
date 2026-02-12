import { MigrationInterface, QueryRunner } from "typeorm";

export class Phase20Governance1770858547280 implements MigrationInterface {
    name = 'Phase20Governance1770858547280'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "system_config" ADD "environment" character varying NOT NULL DEFAULT 'DEV'`);
        await queryRunner.query(`ALTER TABLE "discovered_service" ADD "projectId" uuid`);
        await queryRunner.query(`ALTER TABLE "discovered_service" ADD CONSTRAINT "FK_4f8b005b76002a9b67cd818afc6" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "discovered_service" DROP CONSTRAINT "FK_4f8b005b76002a9b67cd818afc6"`);
        await queryRunner.query(`ALTER TABLE "discovered_service" DROP COLUMN "projectId"`);
        await queryRunner.query(`ALTER TABLE "system_config" DROP COLUMN "environment"`);
    }

}
