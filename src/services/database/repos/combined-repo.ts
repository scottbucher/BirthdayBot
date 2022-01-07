import { RawGuildCelebrationData } from '../../../models/database';
import { SqlUtils } from '../../../utils';
import { DataAccess } from '../data-access';
import { Procedure } from '../procedure';

export class CombinedRepo {
    constructor(private dataAccess: DataAccess) {}

    public async GetRawCelebrationData(discordIds: string[]): Promise<RawGuildCelebrationData> {
        const results = await this.dataAccess.executeProcedure(
            Procedure.Combined_GetRawCelebrationData,
            [discordIds.join(',')]
        );
        const guildData = SqlUtils.getTable(results, 0);
        const customMessages = SqlUtils.getTable(results, 1);
        const blacklist = SqlUtils.getTable(results, 2);
        const trustedRoles = SqlUtils.getTable(results, 3);
        const anniversaryRoles = SqlUtils.getTable(results, 4);
        return new RawGuildCelebrationData(
            guildData,
            customMessages,
            blacklist,
            trustedRoles,
            anniversaryRoles
        );
    }
}
