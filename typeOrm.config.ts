import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';

config();

const configService = new ConfigService();

type BuildTypeOrmOptionsParams = {
    configService: ConfigService;
    schema?: string;
    entities: DataSourceOptions['entities'];
    migrations?: DataSourceOptions['migrations'];
};

export const buildTypeOrmOptions = ({
    configService,
    schema,
    entities,
    migrations,
}: BuildTypeOrmOptionsParams): DataSourceOptions => ({
    type: 'postgres',
    host: configService.getOrThrow<string>('DB_HOST'),
    port: Number(configService.getOrThrow<string>('DB_PORT')),
    database: configService.getOrThrow<string>('DB_NAME'),
    username: configService.getOrThrow<string>('DB_USER'),
    password: configService.getOrThrow<string>('DB_PASSWORD'),
    schema,
    entities,
    migrations,
    synchronize: configService.get('DB_SYNC') === 'true',
});

export default new DataSource(
    buildTypeOrmOptions({
        configService,
        entities: ['./apps/**/*.entity.js'],
        migrations: ['./migrations/*.ts'],
    }),
);
