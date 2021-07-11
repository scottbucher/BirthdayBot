import { CelebrationUtils, MessageUtils } from '../utils';
import { Client, Guild, GuildMember, MessageEmbed, Role, TextChannel } from 'discord.js';

import { GuildCelebrationData } from '../models/database';
import { Lang } from './lang';
import { LangCode } from '../models/enums';
import { Logger } from '.';

let Config = require('../../config/config.json');
let Logs = require('../../lang/logs.json');
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

            try {
                // We need to filter the lists to only the GuildMembers in this guild and find the data for this guild
                let birthdaysInThisGuild: GuildMember[] = birthdayMessageGuildMembers.filter(
                    member => member.guild.id === guild.id
                );
                let anniversariesInThisGuild: GuildMember[] =
                    memberAnniversaryMessageGuildMembers.filter(
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

                ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                // The birthday channel must exists and we need to have members who need the message
                if (birthdayChannel && birthdaysInThisGuild.length > 0) {
                    // Get our list of trusted roles
                    trustedRoles = await CelebrationUtils.getTrustedRoleList(
                        guild,
                        filteredGuild.trustedRoles
                    );

                    // Remove the GuildMembers who don't pass the trusted check
                    birthdaysInThisGuild = birthdaysInThisGuild.filter(member =>
                        CelebrationUtils.passesTrustedCheck(
                            filteredGuild.guildData.RequireAllTrustedRoles,
                            trustedRoles,
                            member,
                            filteredGuild.guildData.TrustedPreventsMessage,
                            hasPremium
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
                        let birthdayMembersUserSpecific: GuildMember[] =
                            birthdaysInThisGuild.filter(member =>
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
                            // Get our custom message
                            let customMessage = birthdayUserSpecificMessages.find(
                                message => message.UserDiscordId
                            );
                            // Get the mention string
                            let mentionString =
                                filteredGuild.guildData.BirthdayMentionSetting !== 'none'
                                    ? CelebrationUtils.getMentionString(
                                          filteredGuild.guildData,
                                          guild,
                                          'birthday'
                                      )
                                    : '';

                            // Compile our user list to put in the message
                            let userList = CelebrationUtils.getUserListString(
                                filteredGuild.guildData,
                                [birthdayMember]
                            );

                            // Replace the placeholders
                            message = CelebrationUtils.replacePlaceHolders(
                                customMessage.Message,
                                guild,
                                customMessage.Type,
                                userList,
                                null
                            );

                            // Find the color of the embed
                            color = CelebrationUtils.getMessageColor(customMessage, hasPremium);

                            // Send our message(s)
                            if (mentionString && mentionString !== '')
                                await MessageUtils.send(birthdayChannel, mentionString);

                            let embed = new MessageEmbed().setDescription(message).setColor(color);
                            await MessageUtils.sendWithDelay(
                                birthdayChannel,
                                customMessage.Embed ? embed : message,
                                Config.delays.messages
                            );
                        }
                    }

                    // Get our generic birthday messages
                    let message = Lang.getRef('defaults.birthdayMessage', LangCode.EN_US);
                    let color = Config.colors.default;
                    let useEmbed = true;

                    // Get the mention string
                    let mentionString =
                        filteredGuild.guildData.BirthdayMentionSetting !== 'none'
                            ? CelebrationUtils.getMentionString(
                                  filteredGuild.guildData,
                                  guild,
                                  'birthday'
                              )
                            : '';

                    // Compile our user list to put in the message
                    let userList = CelebrationUtils.getUserListString(
                        filteredGuild.guildData,
                        birthdaysInThisGuild
                    );

                    // Add the compiled user list
                    if (birthdayMessages.length > 0) {
                        // Get our custom message
                        let customMessage = CelebrationUtils.randomMessage(
                            birthdayMessages,
                            hasPremium
                        );

                        // Find the color of the embed
                        color = CelebrationUtils.getMessageColor(customMessage, hasPremium);
                        useEmbed = customMessage.Embed ? true : false;

                        message = customMessage.Message;
                    }

                    // Replace the placeholders
                    message = CelebrationUtils.replacePlaceHolders(
                        message,
                        guild,
                        'birthday',
                        userList,
                        null
                    );

                    // Send our message(s)
                    if (mentionString && mentionString !== '')
                        await MessageUtils.send(birthdayChannel, mentionString);

                    let embed = new MessageEmbed().setDescription(message).setColor(color);
                    await MessageUtils.sendWithDelay(
                        birthdayChannel,
                        useEmbed ? embed : message,
                        Config.delays.messages
                    );
                }
                ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                // The member anniversary channel must exists and we need to have members who need the message
                if (memberAnniversaryChannel && anniversariesInThisGuild.length > 0) {
                    // Get our generic member anniversary message
                    let message = Lang.getRef('defaults.memberAnniversaryMessage', LangCode.EN_US);
                    let color = Config.colors.default;
                    let useEmbed = true;

                    // Get all member anniversary messages
                    let memberAnniversaryMessages = filteredGuild.customMessages.filter(
                        message =>
                            message.Type === 'memberanniversary' && message.UserDiscordId === '0'
                    );

                    // Get an array of year values (Use set to remove duplicates)
                    let differentYears = [
                        ...new Set(
                            anniversariesInThisGuild.map(data =>
                                CelebrationUtils.getMemberYears(data, filteredGuild.guildData)
                            )
                        ),
                    ];
                    // Get the mention string
                    let mentionString =
                        filteredGuild.guildData.MemberAnniversaryMentionSetting !== 'none'
                            ? CelebrationUtils.getMentionString(
                                  filteredGuild.guildData,
                                  guild,
                                  'memberanniversary'
                              )
                            : '';

                    let embedMessagesToSend: MessageEmbed[] = [];
                    let regularMessagesToSend: string[] = [];

                    for (let year of differentYears) {
                        // Compile our user list to put in the message
                        let userList = CelebrationUtils.getUserListString(
                            filteredGuild.guildData,
                            anniversariesInThisGuild.filter(
                                member =>
                                    CelebrationUtils.getMemberYears(
                                        member,
                                        filteredGuild.guildData
                                    ) === year
                            )
                        );

                        // Add the compiled user list
                        if (memberAnniversaryMessages.length > 0) {
                            // Get our custom message
                            let customMessage = CelebrationUtils.randomMessage(
                                memberAnniversaryMessages,
                                hasPremium
                            );

                            // TEMP UNTIL THE YEAR PROBLEM IS ADDRESSED
                            // Find the color of the embed
                            color = CelebrationUtils.getMessageColor(customMessage, hasPremium);

                            useEmbed = customMessage.Embed ? true : false;

                            message = customMessage.Message;
                        }

                        // Replace the placeholders
                        message = CelebrationUtils.replacePlaceHolders(
                            message,
                            guild,
                            'memberanniversary',
                            userList,
                            year
                        );

                        let embed = new MessageEmbed().setDescription(message).setColor(color);
                        if (useEmbed) {
                            embedMessagesToSend.push(embed);
                        } else {
                            regularMessagesToSend.push(message);
                        }
                    }

                    if (
                        mentionString &&
                        mentionString !== '' &&
                        (embedMessagesToSend.length > 0 || regularMessagesToSend.length > 0)
                    )
                        await MessageUtils.send(memberAnniversaryChannel, mentionString);

                    // Compile our list of regular messages to send based on the 4096 character limit
                    let regularMessages: string[] = [];
                    let counter = 0;
                    if (regularMessagesToSend.length > 0) {
                        for (let message of regularMessagesToSend) {
                            if (regularMessages[counter].concat('\n\n' + message).length > 4096) {
                                counter++;
                                regularMessages.push(message);
                            } else {
                                regularMessages[counter] = regularMessages[counter].concat(
                                    '\n\n' + message
                                );
                            }
                        }
                    }

                    // Compile our list of embed messages to send based on the 4096 character limit

                    // First we need to get a list of colors by mapping and removing duplicates
                    // If they don't have premium use the default color otherwise use the colors of the custom messages
                    let colors: number[] = hasPremium
                        ? [...new Set(embedMessagesToSend.map(embed => embed.color))]
                        : [Config.colors.default];

                    // Now we loop through the colors and create a list of messages to send
                    let embedMessages: MessageEmbed[] = [];
                    counter = 0;
                    for (let color of colors) {
                        // Only get the messages that have the specified color if they have premium
                        let embedDescriptions: string[] = embedMessagesToSend
                            .filter(embed => !hasPremium || embed.color === color)
                            .map(embed => embed.description);
                        for (let message of embedDescriptions) {
                            if (embedMessages.length === 0) {
                                embedMessages.push(
                                    new MessageEmbed().setColor(color).setDescription(message)
                                );
                            } else if (
                                embedMessages[counter].description.concat('\n\n' + message).length >
                                4096
                            ) {
                                counter++;
                                embedMessages.push(
                                    new MessageEmbed().setDescription(message).setColor(color)
                                );
                            } else {
                                embedMessages[counter].description = embedMessages[
                                    counter
                                ].description.concat('\n\n' + message);
                            }
                        }
                        counter++;
                    }

                    if (embedMessages.length > 0) {
                        // Send our message(s)

                        for (let message of embedMessages)
                            await MessageUtils.sendWithDelay(
                                memberAnniversaryChannel,
                                message,
                                Config.delays.messages
                            );
                    }

                    if (regularMessagesToSend.length > 0) {
                        // Send our message(s)

                        for (let message of regularMessagesToSend)
                            await MessageUtils.sendWithDelay(
                                memberAnniversaryChannel,
                                message,
                                Config.delays.messages
                            );
                    }
                }

                ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                // The server anniversary channel must exists and this guild needs to have Celebration Data
                if (
                    guildsWithAnniversaryMessage
                        .map(g => g.id)
                        .includes(filteredGuild.guildData.GuildDiscordId) &&
                    serverAnniversaryChannel &&
                    thisGuildCelebrationData
                ) {
                    // Get our generic server anniversary message
                    let message = Lang.getRef('defaults.serverAnniversaryMessage', LangCode.EN_US);
                    let color = Config.colors.default;
                    let useEmbed = true;

                    // Get all server anniversary messages
                    let serverAnniversaryMessages = filteredGuild.customMessages.filter(
                        message =>
                            message.Type === 'serveranniversary' && message.UserDiscordId === '0'
                    );

                    // Get the mention string
                    let mentionString =
                        filteredGuild.guildData.ServerAnniversaryMentionSetting !== 'none'
                            ? CelebrationUtils.getMentionString(
                                  filteredGuild.guildData,
                                  guild,
                                  'serveranniversary'
                              )
                            : '';

                    let serverYears = CelebrationUtils.getServerYears(
                        guild,
                        filteredGuild.guildData
                    );
                    // Add the compiled user list
                    if (serverAnniversaryMessages.length > 0) {
                        // Get our custom message
                        let customMessage = CelebrationUtils.randomMessage(
                            serverAnniversaryMessages,
                            hasPremium
                        );

                        // Replace the placeholders
                        message = CelebrationUtils.replacePlaceHolders(
                            customMessage.Message,
                            guild,
                            customMessage.Type,
                            null,
                            serverYears
                        );

                        // Find the color of the embed
                        color = CelebrationUtils.getMessageColor(customMessage, hasPremium);

                        useEmbed = customMessage.Embed ? true : false;

                        message = customMessage.Message;
                    }

                    // Replace the placeholders
                    message = CelebrationUtils.replacePlaceHolders(
                        message,
                        guild,
                        'serveranniversary',
                        null,
                        serverYears
                    );

                    // Send our message(s)
                    if (mentionString && mentionString !== '')
                        await MessageUtils.send(serverAnniversaryChannel, mentionString);

                    let embed = new MessageEmbed().setDescription(message).setColor(color);
                    await MessageUtils.sendWithDelay(
                        serverAnniversaryChannel,
                        useEmbed ? embed : message,
                        Config.delays.messages
                    );
                }
                ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            } catch (error) {
                // This guild had an error but we want to keep going
                Logger.error(
                    Logs.error.messageServiceFailedForGuild
                        .replace('{GUILD_ID}', guild.id)
                        .replace('{GUILD_NAME}', guild.name),
                    error
                );
                continue;
            }
        }
    }
}
