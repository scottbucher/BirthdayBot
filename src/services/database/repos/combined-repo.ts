import { RawGuildCelebrationData } from '../../../models/database/index.js';
import { SqlUtils } from '../../../utils/index.js';
import { DataAccess, Procedure } from '../index.js';

export class CombinedRepo {
    constructor(private dataAccess: DataAccess) {}

    public async GetRawCelebrationData(discordIds: string[]): Promise<RawGuildCelebrationData> {
        let results = await this.dataAccess.executeProcedure(
            Procedure.Combined_GetRawCelebrationData,
            [discordIds.join(',')]
        );
        let guildData = SqlUtils.getTable(results, 0);
        let customMessages = SqlUtils.getTable(results, 1);
        let blacklist = SqlUtils.getTable(results, 2);
        let trustedRoles = SqlUtils.getTable(results, 3);
        let anniversaryRoles = SqlUtils.getTable(results, 4);
        return new RawGuildCelebrationData(
            guildData,
            customMessages,
            blacklist,
            trustedRoles,
            anniversaryRoles
        );
    }
}
