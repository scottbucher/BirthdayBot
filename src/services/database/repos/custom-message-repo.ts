import { CustomMessages } from '../../../models/database';
import { SQLUtils } from '../../../utils';
import { DataAccess } from '../data-access';
import { Procedure } from '../procedure';

export class CustomMessageRepo {
    constructor(private dataAccess: DataAccess) {}

    public async addCustomMessage(discordId: string, message: string): Promise<void> {
        await this.dataAccess.executeProcedure(Procedure.CustomMessages_Add, [discordId, message]);
    }

    public async getCustomMessages(discordId: string): Promise<CustomMessages> {
        let results = await this.dataAccess.executeProcedure(Procedure.CustomMessages_Get, [
            discordId,
        ]);

        let customMessages = SQLUtils.getTable(results, 0);
        return new CustomMessages(customMessages, null);
    }

    public async clearCustomMessages(discordId: string): Promise<void> {
        await this.dataAccess.executeProcedure(Procedure.CustomMessages_Clear, [discordId]);
    }

    public async removeCustomMessage(discordId: string, value: number): Promise<void> {
        await this.dataAccess.executeProcedure(Procedure.CustomMessages_Remove, [discordId, value]);
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
