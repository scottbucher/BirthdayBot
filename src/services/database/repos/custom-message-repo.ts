import { CustomMessages } from '../../../models/database/custom-messages-models';
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

        let customMessages = SQLUtils.getFirstResult(results);
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

        let customMessageData = SQLUtils.getFirstResult(results);
        let stats = SQLUtils.getSecondResultFirstRow(results);
        return new CustomMessages(customMessageData, stats);
    }
}
