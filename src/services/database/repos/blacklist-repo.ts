import { Blacklisted } from '../../../models/database';

import { DataAccess } from '../data-access';
import { Procedure } from '../procedure';
import { SQLUtils } from '../../../utils';

export class BlacklistRepo {
    constructor(private dataAccess: DataAccess) {}

    public async addBlacklist(discordId: string, userId: string): Promise<void> {
        await this.dataAccess.executeProcedure(Procedure.Blacklist_Add, [discordId, userId]);
    }

    public async removeBlacklist(discordId: string, userId: string): Promise<void> {
        await this.dataAccess.executeProcedure(Procedure.Blacklist_Remove, [discordId, userId]);
    }

    public async clearBlacklist(discordId: string): Promise<void> {
        await this.dataAccess.executeProcedure(Procedure.Blacklist_Clear, [discordId]);
    }

    public async getBlacklist(discordId: string): Promise<Blacklisted> {
        let results = await this.dataAccess.executeProcedure(Procedure.Blacklist_Get, [discordId]);

        let blacklist = SQLUtils.getTable(results, 0);
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

        let blacklistData = SQLUtils.getTable(results, 0);
        let stats = SQLUtils.getRow(results, 1, 0);
        return new Blacklisted(blacklistData, stats);
    }
}
