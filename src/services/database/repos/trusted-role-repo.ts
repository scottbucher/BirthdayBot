import { TrustedRoles } from '../../../models/database/trusted-role-models';
import { SqlUtils } from '../../../utils';
import { DataAccess } from '../data-access';
import { Procedure } from '../procedure';

export class TrustedRoleRepo {
    constructor(private dataAccess: DataAccess) {}

    public async addTrustedRole(discordId: string, roleId: string): Promise<void> {
        await this.dataAccess.executeProcedure(Procedure.TrustedRole_Add, [discordId, roleId]);
    }

    public async removeTrustedRole(discordId: string, position: number): Promise<void> {
        await this.dataAccess.executeProcedure(Procedure.TrustedRole_Remove, [discordId, position]);
    }

    public async clearTrustedRoles(discordId: string): Promise<void> {
        await this.dataAccess.executeProcedure(Procedure.TrustedRole_Clear, [discordId]);
    }

    public async getTrustedRoles(discordId: string): Promise<TrustedRoles> {
        const results = await this.dataAccess.executeProcedure(Procedure.TrustedRole_Get, [
            discordId,
        ]);

        const trustedRoles = SqlUtils.getTable(results, 0);
        return new TrustedRoles(trustedRoles, null);
    }

    public async getTrustedRoleList(
        guildId: string,
        pageSize: number,
        page: number
    ): Promise<TrustedRoles> {
        const results = await this.dataAccess.executeProcedure(Procedure.TrustedRole_GetList, [
            guildId,
            pageSize,
            page,
        ]);

        const trustedRoleData = SqlUtils.getTable(results, 0);
        const stats = SqlUtils.getRow(results, 1, 0);
        return new TrustedRoles(trustedRoleData, stats);
    }
}
