import mysql, { ConnectionConfig, Pool } from 'mysql';

import { SqlUtils } from '../../utils';

export class DataAccess {
    private pool: Pool;

    constructor(private dbConfig: ConnectionConfig) {
        this.reconnect();
    }

    public async executeProcedure(name: string, params: any[]): Promise<any> {
        let sql = SqlUtils.createProcedureSql(name, params);
        return new Promise((resolve, reject) => {
            // let startTime = Date.now();
            this.pool.query(sql, (error, results) => {
                if (error) reject(error);
                else {
                    // let endTime = Date.now();
                    // let executionSecs = +((endTime - startTime) / 1000).toFixed(3);
                    // Logger.info(`'${name}' took ${executionSecs} seconds. Query: ${sql}`); // ToDo: Make this a debug log
                    resolve(results);
                }
            });
        });
    }

    private reconnect(): void {
        this.pool = mysql.createPool({
            ...this.dbConfig,
            typeCast: (field, next) => this.typeCast(field, next),
        });
    }

    private typeCast(field: any, next: any): any {
        if (field.type === 'TINY' && field.length === 1) {
            return field.string() === '1';
        } else {
            return next();
        }
    }
}
