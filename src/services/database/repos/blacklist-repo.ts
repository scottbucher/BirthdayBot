import { DataAccess } from '../data-access';
import { Procedure } from '../procedure';

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
}