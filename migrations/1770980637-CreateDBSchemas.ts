import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDBSchemas1770902050140 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "analytics"`);
        await queryRunner.query(
            `CREATE SCHEMA IF NOT EXISTS "shortlinks_resolver"`,
        );
        await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "users"`);

        // limit create ability on `public` schema
        await queryRunner.query(`REVOKE CREATE ON SCHEMA public FROM PUBLIC;`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP SCHEMA IF EXISTS "analytics"`);
        await queryRunner.query(`DROP SCHEMA IF EXISTS "shortlinks_resolver"`);
        await queryRunner.query(`DROP SCHEMA IF EXISTS "users"`);

        await queryRunner.query(`GRANT CREATE ON SCHEMA public TO PUBLIC;`);
    }
}
