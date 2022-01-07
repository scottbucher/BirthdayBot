import { Blacklisted } from '../../../models/database';
import { SqlUtils } from '../../../utils';
import { DataAccess } from '../data-access';
import { Procedure } from '../procedure';

export class BlacklistRepo {
    constructor(private dataAccess: DataAccess) {}

    public async addBlacklist(discordId: string, targetId: string): Promise<void> {
        await this.dataAccess.executeProcedure(Procedure.Blacklist_Add, [discordId, targetId]);
    }

    public async removeBlacklist(discordId: string, targetId: string): Promise<void> {
        await this.dataAccess.executeProcedure(Procedure.Blacklist_Remove, [discordId, targetId]);
    }

    public async clearBlacklist(discordId: string): Promise<void> {
        await this.dataAccess.executeProcedure(Procedure.Blacklist_Clear, [discordId]);
    }

    public async getBlacklist(discordId: string): Promise<Blacklisted> {
        const results = await this.dataAccess.executeProcedure(Procedure.Blacklist_Get, [discordId]);

        const blacklist = SqlUtils.getTable(results, 0);
        return new Blacklisted(blacklist, null);
    }

    public async getBlacklistList(
        guildId: string,
        pageSize: number,
        page: number
    ): Promise<Blacklisted> {
        const results = await this.dataAccess.executeProcedure(Procedure.Blacklist_GetList, [
            guildId,
            pageSize,
            page,
        ]);

        const blacklistData = SqlUtils.getTable(results, 0);
        const stats = SqlUtils.getRow(results, 1, 0);
        return new Blacklisted(blacklistData, stats);
    }
}
