import { ActionUtils, CelebrationUtils, ColorUtils, MessageUtils } from '../utils';
import {
    Client,
    Collection,
    Guild,
    GuildMember,
    MessageEmbed,
    Role,
    TextChannel,
} from 'discord.js';

import { GuildCelebrationData } from '../models/database';

let Config = require('../../config/config.json');
export class MessageService {
    // TODO: add to config
    public interval: number = 0.5;

    public async run(
        client: Client,
        guildCelebrationDatas: GuildCelebrationData[],
        birthdayMessageGuildMembers: GuildMember[],
        memberAnniversaryMessageGuildMembers: GuildMember[],
        guildsWithAnniversaryMessage: Guild[],
        guildsWithPremium: string[]
    ): Promise<void> {
        // Only get the guilds which actually might need a message sent
        let filteredGuilds = guildCelebrationDatas.filter(
            data =>
                birthdayMessageGuildMembers
                    .map(member => member.guild.id)
                    .includes(data.guildData.GuildDiscordId) ||
                memberAnniversaryMessageGuildMembers
                    .map(member => member.guild.id)
                    .includes(data.guildData.GuildDiscordId) ||
                guildsWithAnniversaryMessage
                    .map(guild => guild.id)
                    .includes(data.guildData.GuildDiscordId)
        );

        // Lets loop through the guilds that are left
        for (let filteredGuild of filteredGuilds) {
            // Lets see if we already have the guild
            let guild: Guild = guildsWithAnniversaryMessage.find(
                data => data.id === filteredGuild.guildData.GuildDiscordId
            );

            // If we don't we need to fetch it
            if (!guild) {
                try {
                    guild = await client.guilds.fetch(filteredGuild.guildData.GuildDiscordId);
                } catch (error) {
                    continue;
                }
            }

            // We need to filter the lists to only the GuildMembers in this guild and find the data for this guild
            let birthdaysInThisGuild: GuildMember[] = birthdayMessageGuildMembers.filter(
                member => member.guild.id === guild.id
            );
            let anniversariesInThisGuild: GuildMember[] = memberAnniversaryMessageGuildMembers.filter(
                member => member.guild.id === guild.id
            );
            let thisGuildCelebrationData: GuildCelebrationData = guildCelebrationDatas.find(
                data => data.guildData.GuildDiscordId === guild.id
            );

            let hasPremium = guildsWithPremium.includes(guild.id);
            let birthdayChannel: TextChannel;
            let trustedRoles: Role[];
            let memberAnniversaryChannel: TextChannel;
            let serverAnniversaryChannel: TextChannel;

            try {
                birthdayChannel = guild.channels.resolve(
                    filteredGuild.guildData.BirthdayChannelDiscordId
                ) as TextChannel;
            } catch (error) {
                // No birthday channel
            }

            try {
                memberAnniversaryChannel = guild.channels.resolve(
                    filteredGuild.guildData.MemberAnniversaryChannelDiscordId
                ) as TextChannel;
            } catch (error) {
                // No Member Anniversary Channel channel
            }

            try {
                serverAnniversaryChannel = guild.channels.resolve(
                    filteredGuild.guildData.ServerAnniversaryChannelDiscordId
                ) as TextChannel;
            } catch (error) {
                // No Server Anniversary channel
            }

            // The birthday channel must exists and we need to have members who need the message
            if (birthdayChannel && birthdaysInThisGuild.length > 0) {
                // Get our list of trusted roles
                for (let role of filteredGuild.trustedRoles) {
                    try {
                        let tRole: Role = await guild.roles.fetch(role.TrustedRoleDiscordId);
                        if (tRole) trustedRoles.push(tRole);
                    } catch (error) {
                        // Trusted role is invalid
                    }
                }

                // Remove the GuildMembers who don't pass the trusted check
                birthdaysInThisGuild = birthdaysInThisGuild.filter(member =>
                    CelebrationUtils.passesTrustedCheck(
                        filteredGuild,
                        trustedRoles,
                        member,
                        filteredGuild.guildData.TrustedPreventsMessage
                    )
                );

                // Get all birthday messages
                let birthdayMessages = filteredGuild.customMessages.filter(
                    message => message.Type === 'birthday' && message.UserDiscordId === '0'
                );

                // Lets deal with the user specific messages if they have premium
                if (hasPremium) {
                    let color = Config.colors.default;
                    // All messages with a user id (and where that user id exists in our birthday guild member list) is a user specific message
                    let birthdayUserSpecificMessages = filteredGuild.customMessages.filter(
                        message =>
                            message.Type === 'birthday' &&
                            message.UserDiscordId !== '0' &&
                            birthdaysInThisGuild
                                .map(member => member.id)
                                .includes(message.UserDiscordId)
                    );

                    // List of members with a user specific message
                    let birthdayMembersUserSpecific: GuildMember[] = birthdaysInThisGuild.filter(
                        member =>
                            birthdayUserSpecificMessages
                                .map(message => message.UserDiscordId)
                                .includes(member.id)
                    );

                    // Now update the original list by removing guildMembers in the user specific list
                    birthdaysInThisGuild = birthdaysInThisGuild.filter(
                        birthday => !birthdayMembersUserSpecific.includes(birthday)
                    );

                    // Send our user specific messages for this guild
                    for (let birthdayMember of birthdayMembersUserSpecific) {
                        let message: string;
                        let customMessage = birthdayUserSpecificMessages.find(
                            message => message.UserDiscordId
                        );
                        let mentionString =
                            filteredGuild.guildData.BirthdayMentionSetting !== 'none'
                                ? CelebrationUtils.getMentionString(filteredGuild.guildData, guild)
                                : '';

                        let userList = CelebrationUtils.getUserListString(filteredGuild.guildData, [
                            birthdayMember,
                        ]);

                        color = customMessage.Color === '0' ? Config.colors.default : null;

                        color = !color
                            ? '#' + ColorUtils.findHex(customMessage.Color) ?? Config.colors.default
                            : Config.colors.default;

                        message = customMessage.Message.split('@Users')
                            .join(userList)
                            .split('<Users>')
                            .join(userList);

                        if (mentionString !== '')
                            await MessageUtils.send(birthdayChannel, mentionString);

                        let embed = new MessageEmbed().setDescription(message).setColor(color);
                        await MessageUtils.send(
                            birthdayChannel,
                            customMessage.Embed ? embed : message
                        );
                    }
                }

                // Send our generic birthday messages

                let message: string;
                let color = Config.colors.default;
                let customMessage = CelebrationUtils.randomMessage(birthdayMessages, hasPremium);
                let mentionString =
                    filteredGuild.guildData.BirthdayMentionSetting !== 'none'
                        ? CelebrationUtils.getMentionString(filteredGuild.guildData, guild)
                        : '';

                let userList = CelebrationUtils.getUserListString(
                    filteredGuild.guildData,
                    birthdaysInThisGuild
                );

                color = customMessage.Color === '0' ? Config.colors.default : null;

                color = !color
                    ? '#' + ColorUtils.findHex(customMessage.Color) ?? Config.colors.default
                    : Config.colors.default;

                message = customMessage.Message.split('@Users')
                    .join(userList)
                    .split('<Users>')
                    .join(userList);

                if (mentionString !== '') await MessageUtils.send(birthdayChannel, mentionString);

                let embed = new MessageEmbed().setDescription(message).setColor(color);
                await MessageUtils.send(birthdayChannel, customMessage.Embed ? embed : message);
            }
        }
    }
}
