import { MigrationInterface, QueryRunner } from "typeorm";

export class Phase21GovernanceRefinement1770860469317 implements MigrationInterface {
    name = 'Phase21GovernanceRefinement1770860469317'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "business_domain" ADD "projectId" uuid`);
        await queryRunner.query(`ALTER TABLE "business_domain" DROP CONSTRAINT "UQ_a6f37633d232f57f46c19ffa5a5"`);
        await queryRunner.query(`ALTER TABLE "business_domain" ADD CONSTRAINT "FK_9c545a482c823395e6466474687" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "business_domain" DROP CONSTRAINT "FK_9c545a482c823395e6466474687"`);
        await queryRunner.query(`ALTER TABLE "business_domain" ADD CONSTRAINT "UQ_a6f37633d232f57f46c19ffa5a5" UNIQUE ("name")`);
        await queryRunner.query(`ALTER TABLE "business_domain" DROP COLUMN "projectId"`);
    }

}
