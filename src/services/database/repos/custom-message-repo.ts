import { CustomMessages } from '../../../models/database';
import { DataAccess } from '../data-access';
import { Procedure } from '../procedure';
import { SQLUtils } from '../../../utils';

export class CustomMessageRepo {
    constructor(private dataAccess: DataAccess) {}

    public async addCustomMessage(discordId: string, message: string): Promise<void> {
        await this.dataAccess.executeProcedure(Procedure.CustomMessages_Add, [discordId, message]);
    }

    public async removeCustomMessage(discordId: string, value: number): Promise<void> {
        await this.dataAccess.executeProcedure(Procedure.CustomMessages_Remove, [discordId, value]);
    }

    public async clearCustomMessages(discordId: string): Promise<void> {
        await this.dataAccess.executeProcedure(Procedure.CustomMessages_Clear, [discordId]);
    }

    public async getCustomMessages(discordId: string): Promise<CustomMessages> {
        let results = await this.dataAccess.executeProcedure(Procedure.CustomMessages_Get, [
            discordId,
        ]);

        let customMessages = SQLUtils.getTable(results, 0);
        return new CustomMessages(customMessages, null);
    }

    public async getCustomMessageList(
        guildId: string,
        pageSize: number,
        page: number
    ): Promise<CustomMessages> {
        let results = await this.dataAccess.executeProcedure(Procedure.CustomMessages_GetList, [
            guildId,
            pageSize,
            page,
        ]);

        let customMessageData = SQLUtils.getTable(results, 0);
        let stats = SQLUtils.getRow(results, 1, 0);
        return new CustomMessages(customMessageData, stats);
    }
}
