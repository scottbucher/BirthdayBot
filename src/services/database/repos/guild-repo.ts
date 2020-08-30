import { GuildData } from '../../../models/database';
import { SQLUtils } from '../../../utils';
import { DataAccess } from '../data-access';
import { Procedure } from '../procedure';

export class GuildRepo {
    constructor(private dataAccess: DataAccess) {}

    public async getGuild(discordId: string): Promise<GuildData> {
        let results = await this.dataAccess.executeProcedure(Procedure.Guild_Get, [discordId]);
        return SQLUtils.getRow(results, 0, 0);
    }

    public async getGuilds(discordIds: string[]): Promise<GuildData[]> {
        let results = await this.dataAccess.executeProcedure(Procedure.Guild_GetAll, [
            discordIds.join(','),
        ]);
        return SQLUtils.getTable(results, 0);
    }

    public async addOrUpdateGuild(
        discordId: string,
        birthdayChannelId: string,
        birthdayRoleId: string
    ): Promise<void> {
        await this.dataAccess.executeProcedure(Procedure.Guild_AddOrUpdate, [
            discordId,
            birthdayChannelId,
            birthdayRoleId,
        ]);
    }

    public async updateBirthdayChannel(
        discordId: string,
        birthdayChannelId: string
    ): Promise<void> {
        await this.dataAccess.executeProcedure(Procedure.Guild_UpdateBirthdayChannel, [
            discordId,
            birthdayChannelId,
        ]);
    }

    public async updateBirthdayRole(discordId: string, birthdayRoleId: string): Promise<void> {
        await this.dataAccess.executeProcedure(Procedure.Guild_UpdateBirthdayRole, [
            discordId,
            birthdayRoleId,
        ]);
    }

    public async updateTrustedRole(discordId: string, trustedRoleId: string): Promise<void> {
        await this.dataAccess.executeProcedure(Procedure.Guild_UpdateTrustedRole, [
            discordId,
            trustedRoleId,
        ]);
    }

    public async updateMessageTime(discordId: string, messageTime: number): Promise<void> {
        await this.dataAccess.executeProcedure(Procedure.Guild_UpdateMessageTime, [
            discordId,
            messageTime,
        ]);
    }

    public async updateMentionSetting(discordId: string, mention: string): Promise<void> {
        await this.dataAccess.executeProcedure(Procedure.Guild_UpdateMentionSetting, [
            discordId,
            mention,
        ]);
    }

    public async updateUseEmbed(discordId: string, value: number): Promise<void> {
        await this.dataAccess.executeProcedure(Procedure.Guild_UpdateUseEmbed, [discordId, value]);
    }

    public async updateTrustedPreventsMessage(discordId: string, value: number): Promise<void> {
        await this.dataAccess.executeProcedure(Procedure.Guild_UpdateTrustedPreventsMessage, [
            discordId,
            value,
        ]);
    }

    public async updateTrustedPreventsRole(discordId: string, value: number): Promise<void> {
        await this.dataAccess.executeProcedure(Procedure.Guild_UpdateTrustedPreventsRole, [
            discordId,
            value,
        ]);
    }

    public async guildSetupMessage(
        discordId: string,
        messageTime: number,
        mentionSetting: string,
        useEmbed: number
    ): Promise<void> {
        await this.dataAccess.executeProcedure(Procedure.Guild_SetupMessage, [
            discordId,
            messageTime,
            mentionSetting,
            useEmbed,
        ]);
    }

    public async guildSetupTrusted(
        discordId: string,
        trustedRole: string,
        preventRole: number,
        preventMessage: number
    ): Promise<void> {
        await this.dataAccess.executeProcedure(Procedure.Guild_SetupTrusted, [
            discordId,
            trustedRole,
            preventRole,
            preventMessage,
        ]);
    }
}
