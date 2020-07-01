import mysql, { ConnectionConfig, Pool } from 'mysql';

import { SQLUtils } from '../../utils';

export class DataAccess {
    private pool: Pool;

    constructor(private dbConfig: ConnectionConfig) {
        this.reconnect();
    }

    public async executeProcedure(name: string, params: any[]): Promise<any> {
        let sql = SQLUtils.createProcedureSql(name, params);
        return new Promise((resolve, reject) => {
            this.pool.query(sql, (error, results) => {
                if (error) reject(error);
                else resolve(results);
            });
        });
    }

    private reconnect() {
        this.pool = mysql.createPool({
            ...this.dbConfig,
            typeCast: (field, next) => this.typeCast(field, next),
        });
    }

    private typeCast(field: any, next: any) {
        if (field.type === 'TINY' && field.length === 1) {
            return field.string() === '1';
        } else {
            return next();
        }
    }
}
