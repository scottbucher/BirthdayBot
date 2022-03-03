import mysql from 'mysql';

export class SqlUtils {
    public static createProcedureSql(name: string, params: any[]): string {
        let sql = `Call ${name}(${new Array(params.length).fill('?').join(',')});`;
        params = params.map(param => this.typeCast(param));
        return mysql.format(sql, params);
    }

    public static typeCast(param: any): unknown {
        return typeof param === 'boolean' ? +param : param;
    }

    public static getTable(results: any, index: number): any {
        return results[index];
    }

    public static getRow(results: any, tableIndex: number, rowIndex: number): any {
        return results[tableIndex]?.[rowIndex];
    }
}
