import mysql from 'mysql';

export abstract class SQLUtils {
    public static createProcedureSql(name: string, params: any[]): string {
        let sql = `Call ${name}(${new Array(params.length).fill('?').join(',')});`;
        params = params.map(this.typeCast);
        return mysql.format(sql, params);
    }

    public static typeCast(param: any): any {
        return typeof param === 'boolean' ? +param : param;
    }

    public static getFirstResult(results: any): any {
        return results[0];
    }

    public static getSecondResult(results: any): any {
        return results[1];
    }

    public static getFirstResultFirstRow(results: any): any {
        let firstResult = this.getFirstResult(results);
        return !firstResult ? null : firstResult[0];
    }

    public static getSecondResultFirstRow(results: any): any {
        let secondResult = this.getSecondResult(results);
        return !secondResult ? null : secondResult[0];
    }
}
