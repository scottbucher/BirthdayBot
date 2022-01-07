import { GuildData } from '../../../models/database';
import { SqlUtils } from '../../../utils';
import { Logger } from '../../logger';
import { DataAccess } from '../data-access';
import { Procedure } from '../procedure';

export class GuildRepo {
    constructor(private dataAccess: DataAccess) {}

    public async getGuild(discordId: string): Promise<GuildData> {
        const results = await this.dataAccess.executeProcedure(Procedure.Guild_Get, [discordId]);
        return SqlUtils.getRow(results, 0, 0);
    }

    public async getGuilds(discordIds: string[]): Promise<GuildData[]> {
        const results = await this.dataAccess.executeProcedure(Procedure.Guild_GetAll, [
            discordIds.join(','),
        ]);
        return SqlUtils.getTable(results, 0);
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

    public async updateBirthdayChannel(discordId: string, channelId: string): Promise<void> {
        await this.dataAccess.executeProcedure(Procedure.Guild_UpdateBirthdayChannel, [
            discordId,
            channelId,
        ]);
    }

    public async updateMemberAnniversaryChannel(
        discordId: string,
        channelId: string
    ): Promise<void> {
        await this.dataAccess.executeProcedure(Procedure.Guild_UpdateMemberAnniversaryChannel, [
            discordId,
            channelId,
        ]);
    }

    public async updateServerAnniversaryChannel(
        discordId: string,
        channelId: string
    ): Promise<void> {
        await this.dataAccess.executeProcedure(Procedure.Guild_UpdateServerAnniversaryChannel, [
            discordId,
            channelId,
        ]);
    }

    public async updateBirthdayRole(discordId: string, birthdayRoleId: string): Promise<void> {
        await this.dataAccess.executeProcedure(Procedure.Guild_UpdateBirthdayRole, [
            discordId,
            birthdayRoleId,
        ]);
    }

    public async updateBirthdayMasterRole(
        discordId: string,
        birthdayMasterRoleId: string
    ): Promise<void> {
        await this.dataAccess.executeProcedure(Procedure.Guild_UpdateBirthdayMasterRole, [
            discordId,
            birthdayMasterRoleId,
        ]);
    }

    public async updateMessageEmbedColor(discordId: string, hexColor: string): Promise<void> {
        await this.dataAccess.executeProcedure(Procedure.Guild_UpdateMessageEmbedColor, [
            discordId,
            hexColor,
        ]);
    }

    public async updateBirthdayMessageTime(discordId: string, messageTime: number): Promise<void> {
        await this.dataAccess.executeProcedure(Procedure.Guild_UpdateBirthdayMessageTime, [
            discordId,
            messageTime,
        ]);
    }

    public async updateMemberAnniversaryMessageTime(
        discordId: string,
        messageTime: number
    ): Promise<void> {
        await this.dataAccess.executeProcedure(Procedure.Guild_UpdateMemberAnniversaryTime, [
            discordId,
            messageTime,
        ]);
    }

    public async updateServerAnniversaryMessageTime(
        discordId: string,
        messageTime: number
    ): Promise<void> {
        await this.dataAccess.executeProcedure(Procedure.Guild_UpdateServerAnniversaryTime, [
            discordId,
            messageTime,
        ]);
    }

    public async updateBirthdayMentionSetting(discordId: string, mention: string): Promise<void> {
        await this.dataAccess.executeProcedure(Procedure.Guild_UpdateBirthdayMentionSetting, [
            discordId,
            mention,
        ]);
    }

    public async updateMemberAnniversaryMentionSetting(
        discordId: string,
        mention: string
    ): Promise<void> {
        await this.dataAccess.executeProcedure(
            Procedure.Guild_UpdateMemberAnniversaryMentionSetting,
            [discordId, mention]
        );
    }

    public async updateServerAnniversaryMentionSetting(
        discordId: string,
        mention: string
    ): Promise<void> {
        await this.dataAccess.executeProcedure(
            Procedure.Guild_UpdateServerAnniversaryMentionSetting,
            [discordId, mention]
        );
    }

    public async updateNameFormat(discordId: string, format: string): Promise<void> {
        await this.dataAccess.executeProcedure(Procedure.Guild_UpdateNameFormat, [
            discordId,
            format,
        ]);
    }

    public async updateDefaultTimezone(discordId: string, timezone: string): Promise<void> {
        await this.dataAccess.executeProcedure(Procedure.Guild_UpdateDefaultTimezone, [
            discordId,
            timezone,
        ]);
    }

    public async updateUseTimezone(discordId: string, value: string): Promise<void> {
        await this.dataAccess.executeProcedure(Procedure.Guild_UpdateUseTimezone, [
            discordId,
            value,
        ]);
    }

    public async updateTrustedPreventsMessage(discordId: string, value: number): Promise<void> {
        if (discordId === '250678721466466305') {
            Logger.info('Guild 250678721466466305 changed the trusted prevents message.');
        }
        await this.dataAccess.executeProcedure(Procedure.Guild_UpdateTrustedPreventsMessage, [
            discordId,
            value,
        ]);
    }

    public async updateTrustedPreventsRole(discordId: string, value: number): Promise<void> {
        if (discordId === '250678721466466305') {
            Logger.info('Guild 250678721466466305 changed the trusted prevents role.');
        }
        await this.dataAccess.executeProcedure(Procedure.Guild_UpdateTrustedPreventsRole, [
            discordId,
            value,
        ]);
    }

    public async updateRequireAllTrustedRoles(discordId: string, value: number): Promise<void> {
        if (discordId === '250678721466466305') {
            Logger.info('Guild 250678721466466305 changed the require all trusted roles.');
        }
        await this.dataAccess.executeProcedure(Procedure.Guild_UpdateRequireAllTrustedRoles, [
            discordId,
            value,
        ]);
    }

    public async updateDateFormat(discordId: string, value: string): Promise<void> {
        await this.dataAccess.executeProcedure(Procedure.Guild_UpdateDateFormat, [
            discordId,
            value,
        ]);
    }

    public async guildSetupTrusted(
        discordId: string,
        requireAllTrustedRoles: number,
        preventRole: number,
        preventMessage: number
    ): Promise<void> {
        if (discordId === '250678721466466305') {
            Logger.info('Guild 250678721466466305 ran trusted setup.');
        }
        await this.dataAccess.executeProcedure(Procedure.Guild_SetupTrusted, [
            discordId,
            requireAllTrustedRoles,
            preventRole,
            preventMessage,
        ]);
    }

    public async guildSetupAnniversary(
        discordId: string,
        memberAnniversaryChannelId: string,
        serverAnniversaryChannelId: string
    ): Promise<void> {
        await this.dataAccess.executeProcedure(Procedure.Guild_SetupAnniversary, [
            discordId,
            memberAnniversaryChannelId,
            serverAnniversaryChannelId,
        ]);
    }
}
