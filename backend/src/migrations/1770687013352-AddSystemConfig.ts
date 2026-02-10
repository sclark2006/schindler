import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSystemConfig1770687013352 implements MigrationInterface {
    name = 'AddSystemConfig1770687013352'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "system_config" ("key" character varying NOT NULL, "value" character varying NOT NULL, "description" character varying, "isSecret" boolean NOT NULL DEFAULT false, "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_eedd3cd0f227c7fb5eff2204e93" PRIMARY KEY ("key"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "system_config"`);
    }

}
