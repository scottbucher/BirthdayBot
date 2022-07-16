import { TrustedRoleData } from '../../../models/database/trusted-role-models.js';
import { SqlUtils } from '../../../utils/index.js';
import { DataAccess, Procedure } from '../index.js';

export class TrustedRoleRepo {
    constructor(private dataAccess: DataAccess) {}

    public async addTrustedRole(discordId: string, roleId: string): Promise<void> {
        await this.dataAccess.executeProcedure(Procedure.TrustedRole_Add, [discordId, roleId]);
    }

    public async removeTrustedRole(discordId: string, id: string): Promise<void> {
        await this.dataAccess.executeProcedure(Procedure.TrustedRole_Remove, [discordId, id]);
    }

    public async clearTrustedRoles(discordId: string): Promise<void> {
        await this.dataAccess.executeProcedure(Procedure.TrustedRole_Clear, [discordId]);
    }

    public async getTrustedRoles(discordId: string): Promise<TrustedRoleData> {
        let results = await this.dataAccess.executeProcedure(Procedure.TrustedRole_Get, [
            discordId,
        ]);

        let trustedRoles = SqlUtils.getTable(results, 0);
        return new TrustedRoleData(trustedRoles, null);
    }

    public async getTrustedRoleList(
        guildId: string,
        pageSize: number,
        page: number
    ): Promise<TrustedRoleData> {
        let results = await this.dataAccess.executeProcedure(Procedure.TrustedRole_GetList, [
            guildId,
            pageSize,
            page,
        ]);

        let trustedRoles = SqlUtils.getTable(results, 0);
        let stats = SqlUtils.getRow(results, 1, 0);
        return new TrustedRoleData(trustedRoles, stats);
    }
}
