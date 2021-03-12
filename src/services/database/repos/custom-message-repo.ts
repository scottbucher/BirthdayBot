import { CustomMessages } from '../../../models/database';
import { DataAccess } from '../data-access';
import { Procedure } from '../procedure';
import { SQLUtils } from '../../../utils';

export class CustomMessageRepo {
    constructor(private dataAccess: DataAccess) {}

    public async addCustomMessage(
        discordId: string,
        message: string,
        userId: string,
        type: string,
        color: string,
        embed: number
    ): Promise<void> {
        await this.dataAccess.executeProcedure(Procedure.Message_Add, [
            discordId,
            message,
            userId,
            type,
            color,
            embed,
        ]);
    }

    public async removeCustomMessage(
        discordId: string,
        value: number,
        type: string
    ): Promise<void> {
        await this.dataAccess.executeProcedure(Procedure.Message_Remove, [discordId, value, type]);
    }

    public async removeCustomMessageUser(
        discordId: string,
        value: number,
        type: string
    ): Promise<void> {
        await this.dataAccess.executeProcedure(Procedure.Message_RemoveUser, [
            discordId,
            value,
            type,
        ]);
    }

    public async clearCustomMessages(discordId: string, type: string): Promise<void> {
        await this.dataAccess.executeProcedure(Procedure.Message_Clear, [discordId, type]);
    }

    public async clearCustomUserMessages(discordId: string, type: string): Promise<void> {
        await this.dataAccess.executeProcedure(Procedure.Message_ClearUser, [discordId, type]);
    }

    public async getCustomMessages(discordId: string, type: string): Promise<CustomMessages> {
        let results = await this.dataAccess.executeProcedure(Procedure.Message_Get, [
            discordId,
            type,
        ]);

        let customMessages = SQLUtils.getTable(results, 0);
        return new CustomMessages(customMessages, null);
    }

    public async getCustomUserMessages(discordId: string, type: string): Promise<CustomMessages> {
        let results = await this.dataAccess.executeProcedure(Procedure.Message_GetUser, [
            discordId,
            type,
        ]);

        let customMessages = SQLUtils.getTable(results, 0);
        return new CustomMessages(customMessages, null);
    }

    public async getCustomMessageList(
        guildId: string,
        pageSize: number,
        page: number,
        type: string
    ): Promise<CustomMessages> {
        let results = await this.dataAccess.executeProcedure(Procedure.Message_GetList, [
            guildId,
            pageSize,
            page,
            type,
        ]);

        let customMessageData = SQLUtils.getTable(results, 0);
        let stats = SQLUtils.getRow(results, 1, 0);
        return new CustomMessages(customMessageData, stats);
    }

    public async getCustomMessageUserList(
        guildId: string,
        pageSize: number,
        page: number,
        type: string
    ): Promise<CustomMessages> {
        let results = await this.dataAccess.executeProcedure(Procedure.Message_GetUserList, [
            guildId,
            pageSize,
            page,
            type,
        ]);

        let customMessageData = SQLUtils.getTable(results, 0);
        let stats = SQLUtils.getRow(results, 1, 0);
        return new CustomMessages(customMessageData, stats);
    }
}
