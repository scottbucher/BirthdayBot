import { CustomMessages } from '../../../models/database';
import { DataAccess } from '../data-access';
import { Procedure } from '../procedure';
import { SQLUtils } from '../../../utils';
import { TrustedRoles } from '../../../models/database/trusted-role-models';

export class TrustedRoleRepo {
    constructor(private dataAccess: DataAccess) {}

    public async addTrustedRole(discordId: string): Promise<void> {
        await this.dataAccess.executeProcedure(Procedure.TrustedRole_Add, [discordId]);
    }

    public async removeCustomMessage(
        discordId: string,
        value: number,
        type: string
    ): Promise<void> {
        await this.dataAccess.executeProcedure(Procedure.Message_Remove, [discordId, value, type]);
    }

    public async removeTrustedRole(discordId: string, value: number, type: string): Promise<void> {
        await this.dataAccess.executeProcedure(Procedure.Message_RemoveUser, [
            discordId,
            value,
            type,
        ]);
    }

    public async clearTrustedRoles(discordId: string, type: string): Promise<void> {
        await this.dataAccess.executeProcedure(Procedure.Message_Clear, [discordId, type]);
    }

    public async getTrustedRoles(discordId: string, type: string): Promise<TrustedRoles> {
        let results = await this.dataAccess.executeProcedure(Procedure.Message_Get, [
            discordId,
            type,
        ]);

        let trustedRoles = SQLUtils.getTable(results, 0);
        return new TrustedRoles(trustedRoles, null);
    }

    public async getTrustedRoleList(
        guildId: string,
        pageSize: number,
        page: number,
        type: string
    ): Promise<TrustedRoles> {
        let results = await this.dataAccess.executeProcedure(Procedure.Message_GetList, [
            guildId,
            pageSize,
            page,
            type,
        ]);

        let trustedRoleData = SQLUtils.getTable(results, 0);
        let stats = SQLUtils.getRow(results, 1, 0);
        return new TrustedRoles(trustedRoleData, stats);
    }
}
