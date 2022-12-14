import { MikroORM } from '@mikro-orm/core';
import { MongoDriver } from '@mikro-orm/mongodb';

import config from './mikro-orm.config.js';

export class Database {
    public static async connect(): Promise<MikroORM<MongoDriver>> {
        return await MikroORM.init<MongoDriver>(config);
    }
}
