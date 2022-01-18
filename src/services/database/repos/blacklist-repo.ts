import { Blacklisted } from '../../../models/database/index.js';
import { SqlUtils } from '../../../utils/index.js';
import { DataAccess, Procedure } from '../index.js';

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
        let results = await this.dataAccess.executeProcedure(Procedure.Blacklist_Get, [discordId]);

        let blacklist = SqlUtils.getTable(results, 0);
        return new Blacklisted(blacklist, null);
    }

    public async getBlacklistList(
        guildId: string,
        pageSize: number,
        page: number
    ): Promise<Blacklisted> {
        let results = await this.dataAccess.executeProcedure(Procedure.Blacklist_GetList, [
            guildId,
            pageSize,
            page,
        ]);

        let blacklistData = SqlUtils.getTable(results, 0);
        let stats = SqlUtils.getRow(results, 1, 0);
        return new Blacklisted(blacklistData, stats);
    }
}
