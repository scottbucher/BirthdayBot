import { DataAccess } from '../data-access';
import { Procedure } from '../procedure';
import { SQLUtils } from '../../../utils';
import { TrustedRoles } from '../../../models/database/trusted-role-models';

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
        let results = await this.dataAccess.executeProcedure(Procedure.TrustedRole_Get, [
            discordId,
        ]);

        let trustedRoles = SQLUtils.getTable(results, 0);
        return new TrustedRoles(trustedRoles, null);
    }

    public async getTrustedRoleList(
        guildId: string,
        pageSize: number,
        page: number
    ): Promise<TrustedRoles> {
        let results = await this.dataAccess.executeProcedure(Procedure.TrustedRole_GetList, [
            guildId,
            pageSize,
            page,
        ]);

        let trustedRoleData = SQLUtils.getTable(results, 0);
        let stats = SQLUtils.getRow(results, 1, 0);
        return new TrustedRoles(trustedRoleData, stats);
    }
}
