import { Options } from '@mikro-orm/core';
import { MongoDriver } from '@mikro-orm/mongodb';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let Config = require('../../config/config.json');
let Debug = require('../../config/debug.json');

process.env['MIKRO_ORM_DYNAMIC_IMPORTS'] = 'true';

const config: Options<MongoDriver> = {
    type: 'mongo',
    clientUrl: `mongodb://${encodeURIComponent(Config.database.username)}:${encodeURIComponent(
        Config.database.password
    )}@${Config.database.host}`,
    dbName: Config.database.database,
    metadataProvider: TsMorphMetadataProvider,
    entities: ['./dist/database/entities/**/*.js'],
    entitiesTs: ['./src/database/entities/**/*.ts'],
    ensureIndexes: true,
    debug: Debug.logging.mikroOrm,
};

export default config;
