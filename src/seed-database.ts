import { createRequire } from 'node:module';

import { Database } from './database/database.js';
import { DatabaseSeeder } from './database/seeders/database-seeder.js';
import { Logger } from './services/index.js';

const require = createRequire(import.meta.url);
let Logs = require('../lang/logs.json');

async function start(): Promise<void> {
    let orm = await Database.connect();
    let seeder = orm.getSeeder();
    await seeder.seed(DatabaseSeeder);
    await orm.close();
    // Wait for any final logs to be written.
    await new Promise(resolve => setTimeout(resolve, 1000));
}

process.on('unhandledRejection', (reason, _promise) => {
    Logger.error(Logs.error.unhandledRejection, reason);
});

start().catch(error => {
    Logger.error(Logs.error.unspecified, error);
});
