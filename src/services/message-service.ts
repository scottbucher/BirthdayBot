import { BirthdayMessageGuildMembers, MemberAnniversaryMessageGuildMembers } from '../models';
import { CelebrationUtils, MessageUtils } from '../utils';
import { Client, GuildMember, MessageEmbed, Role, TextChannel } from 'discord.js';

import { GuildCelebrationData } from '../models/database';
import { Lang } from './lang';
import { LangCode } from '../models/enums';
import { Logger } from '.';
import { performance } from 'perf_hooks';

let Config = require('../../config/config.json');
let Logs = require('../../lang/logs.json');
export class MessageService {
    // TODO: add to config
    public interval: number = 0.5;

    public async run(
        client: Client,
        guildCelebrationDatas: GuildCelebrationData[],
        birthdayMessageGuildMembers: BirthdayMessageGuildMembers[],
        memberAnniversaryMessageGuildMembers: MemberAnniversaryMessageGuildMembers[],
        serverAnniversaryMessageChannels: TextChannel[],
        guildsWithPremium: string[]
    ): Promise<void> {
        let birthdayMesagePerformanceStart = performance.now();
        // Birhtday Messages
        if (birthdayMessageGuildMembers.length > 0) {
            for (let birthdayMessageGuildMember of birthdayMessageGuildMembers) {
                // Calculate birthday messages for this guild (channel)
                let birthdayMembers = birthdayMessageGuildMember.members;
                let birthdayChannel = birthdayMessageGuildMember.birthdayChannel;

                let guild = birthdayChannel.guild;
                try {
                    let guildCelebrationData = guildCelebrationDatas.find(
                        g => g.guildData.GuildDiscordId === guild.id
                    );

                    let hasPremium = guildsWithPremium.includes(guild.id);

                    let trustedRoles: Role[];

                    // If trusted prevents the message and there are trusted roles in the database lets try to resolve them
                    if (
                        guildCelebrationData.guildData.TrustedPreventsMessage &&
                        guildCelebrationData.trustedRoles.length > 0
                    ) {
                        trustedRoles = await CelebrationUtils.getTrustedRoleList(
                            guild,
                            guildCelebrationData.trustedRoles
                        );
                    }

                    // If there are trusted roles only take those who pass the trusted check
                    if (trustedRoles?.length > 0) {
                        birthdayMembers = birthdayMembers.filter(m =>
                            CelebrationUtils.passesTrustedCheck(
                                guildCelebrationData.guildData.RequireAllTrustedRoles,
                                trustedRoles,
                                m,
                                guildCelebrationData.guildData.TrustedPreventsMessage,
                                hasPremium
                            )
                        );

                        // If we filter all members out we don't need to continue with birthday messages
                        if (birthdayMembers.length === 0) continue;
                    }

                    // Get all regular birthday messages
                    let birthdayMessages = guildCelebrationData.customMessages.filter(
                        message => message.Type === 'birthday' && message.UserDiscordId === '0'
                    );

                    let userSpecificMessagesToSend = [];

                    // User-Specific Birthday Messages
                    if (hasPremium) {
                        let color = Config.colors.default;
                        // All messages with a user id (and where that user id exists in our birthday guild member list) is a user specific message
                        let memberIds = birthdayMembers.map(member => member.id);
                        let birthdayUserSpecificMessages =
                            guildCelebrationData.customMessages.filter(
                                message =>
                                    message.Type === 'birthday' &&
                                    message.UserDiscordId !== '0' &&
                                    memberIds.includes(message.UserDiscordId)
                            );

                        // Map to a user id string array
                        let userSpecificMessageIds = birthdayUserSpecificMessages.map(
                            message => message.UserDiscordId
                        );

                        // List of members with a user specific message
                        let birthdayMembersUserSpecific: GuildMember[] = birthdayMembers.filter(
                            member => userSpecificMessageIds.includes(member.id)
                        );

                        // Now update the original list by removing guildMembers in the user specific list
                        birthdayMembers = birthdayMembers.filter(
                            birthday => !birthdayMembersUserSpecific.includes(birthday)
                        );

                        // Send our user specific messages for this guild
                        for (let birthdayMember of birthdayMembersUserSpecific) {
                            let message: string;
                            // Get our custom message
                            let customMessage = birthdayUserSpecificMessages.find(
                                message => message.UserDiscordId
                            );

                            // Compile our user list to put in the message
                            let userList = CelebrationUtils.getUserListString(
                                guildCelebrationData.guildData,
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

                            let embed = new MessageEmbed().setDescription(message).setColor(color);

                            userSpecificMessagesToSend.push(customMessage.Embed ? embed : message);
                        }
                    }

                    // Get our generic birthday messages
                    let message = Lang.getRef('defaults.birthdayMessage', LangCode.EN_US);
                    let color = Config.colors.default;
                    let useEmbed = true;

                    // Get the mention string
                    let mentionString =
                        guildCelebrationData.guildData.BirthdayMentionSetting !== 'none'
                            ? CelebrationUtils.getMentionString(
                                  guildCelebrationData.guildData,
                                  guild,
                                  'birthday'
                              )
                            : '';

                    // Compile our user list to put in the message
                    let userList = CelebrationUtils.getUserListString(
                        guildCelebrationData.guildData,
                        birthdayMembers
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

                    // Only send one mention string per celebration message type
                    if (mentionString && mentionString !== '')
                        await MessageUtils.send(birthdayChannel, mentionString);

                    // Send our user specific messages for this guild
                    if (userSpecificMessagesToSend?.length > 0) {
                        Logger.info(
                            `Sending user specific member anniversary messages for guild ${guild.name} (ID:${guild.id})`
                        );
                        for (let message of userSpecificMessagesToSend) {
                            await MessageUtils.sendWithDelay(
                                birthdayChannel,
                                message,
                                Config.delays.messages
                            );
                        }
                        Logger.info(
                            `Sent user specific member anniversary messages for guild ${guild.name} (ID:${guild.id})`
                        );
                    }

                    let embed = new MessageEmbed().setDescription(message).setColor(color);
                    Logger.info(
                        `Sending birthday message for guild ${guild.name} (ID:${guild.id})`
                    );
                    await MessageUtils.sendWithDelay(
                        birthdayChannel,
                        useEmbed ? embed : message,
                        Config.delays.messages
                    );
                    Logger.info(`Sent birthday message for guild ${guild.name} (ID:${guild.id})`);
                } catch (error) {
                    // Error when giving out birthday messages
                    Logger.error(
                        Logs.error.birthdayMessageServiceFailed
                            .replace('{GUILD_ID}', guild.id)
                            .replace('{GUILD_NAME}', guild.name),
                        error
                    );
                }
            }
        }
        Logger.info(
            `Finished birthday message service in ${
                (performance.now() - birthdayMesagePerformanceStart) / 1000
            }s`
        );

        let memberAnniversaryMesagePerformanceStart = performance.now();
        // Member Anniversary Messages
        if (memberAnniversaryMessageGuildMembers.length > 0) {
            for (let memberAnniversaryMessageGuildMember of memberAnniversaryMessageGuildMembers) {
                let memberAnniversaryMembers = memberAnniversaryMessageGuildMember.members;
                let memberAnniversaryChannel =
                    memberAnniversaryMessageGuildMember.memberAnniversaryChannel;
                let guild = memberAnniversaryChannel.guild;

                try {
                    let guildCelebrationData = guildCelebrationDatas.find(
                        g => g.guildData.GuildDiscordId === guild.id
                    );

                    let hasPremium = guildsWithPremium.includes(guild.id);

                    // Get all regular birthday messages
                    let memberAnniversaryMessages = guildCelebrationData.customMessages.filter(
                        message =>
                            message.Type === 'memberanniversary' && message.UserDiscordId === '0'
                    );

                    let userSpecificMessagesToSend = [];
                    // User-Specific Member Anniversary Messages
                    if (hasPremium) {
                        let color = Config.colors.default;
                        // All messages with a user id (and where that user id exists in our birthday guild member list) is a user specific message
                        let memberIds = memberAnniversaryMembers.map(member => member.id);
                        let memberAnniversaryUserSpecificMessages =
                            guildCelebrationData.customMessages.filter(
                                message =>
                                    message.Type === 'memberanniversary' &&
                                    message.UserDiscordId !== '0' &&
                                    memberIds.includes(message.UserDiscordId)
                            );

                        // Map to a user id string array
                        let userSpecificMessageIds = memberAnniversaryUserSpecificMessages.map(
                            message => message.UserDiscordId
                        );

                        // List of members with a user specific message
                        let memberAnniversaryMembersUserSpecific: GuildMember[] =
                            memberAnniversaryMembers.filter(member =>
                                userSpecificMessageIds.includes(member.id)
                            );

                        // Now update the original list by removing guildMembers in the user specific list
                        memberAnniversaryMembers = memberAnniversaryMembers.filter(
                            anniversary =>
                                !memberAnniversaryMembersUserSpecific.includes(anniversary)
                        );

                        // Send our user specific messages for this guild
                        for (let anniversaryMember of memberAnniversaryMembersUserSpecific) {
                            let message: string;
                            // Get our custom message
                            let customMessage = memberAnniversaryUserSpecificMessages.find(
                                message => message.UserDiscordId
                            );

                            // Compile our user list to put in the message
                            let userList = CelebrationUtils.getUserListString(
                                guildCelebrationData.guildData,
                                [anniversaryMember]
                            );

                            // Replace the placeholders
                            message = CelebrationUtils.replacePlaceHolders(
                                customMessage.Message,
                                guild,
                                customMessage.Type,
                                userList,
                                CelebrationUtils.getMemberYears(
                                    anniversaryMember,
                                    guildCelebrationData.guildData
                                )
                            );

                            // Find the color of the embed
                            color = CelebrationUtils.getMessageColor(customMessage, hasPremium);

                            let embed = new MessageEmbed().setDescription(message).setColor(color);

                            userSpecificMessagesToSend.push(customMessage.Embed ? embed : message);
                        }
                    }

                    // Get our generic member anniversary message
                    let message = Lang.getRef('defaults.memberAnniversaryMessage', LangCode.EN_US);
                    let color = Config.colors.default;
                    let useEmbed = true;

                    // Get an array of year values (Use set to remove duplicates)
                    let differentYears = [
                        ...new Set(
                            memberAnniversaryMembers.map(data =>
                                CelebrationUtils.getMemberYears(
                                    data,
                                    guildCelebrationData.guildData
                                )
                            )
                        ),
                    ];
                    // Get the mention string
                    let mentionString =
                        guildCelebrationData.guildData.MemberAnniversaryMentionSetting !== 'none'
                            ? CelebrationUtils.getMentionString(
                                  guildCelebrationData.guildData,
                                  guild,
                                  'memberanniversary'
                              )
                            : '';

                    let embedMessagesToSend: MessageEmbed[] = [];
                    let regularMessagesToSend: string[] = [];

                    for (let year of differentYears) {
                        // Compile our user list to put in the message
                        let userList = CelebrationUtils.getUserListString(
                            guildCelebrationData.guildData,
                            memberAnniversaryMembers.filter(
                                member =>
                                    CelebrationUtils.getMemberYears(
                                        member,
                                        guildCelebrationData.guildData
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

                    // Send our user specific messages for this guild
                    if (userSpecificMessagesToSend.length > 0) {
                        Logger.info(
                            `Sending user specific member anniversary messages for guild ${guild.name} (ID:${guild.id})`
                        );
                        for (let message of userSpecificMessagesToSend) {
                            await MessageUtils.sendWithDelay(
                                memberAnniversaryChannel,
                                message,
                                Config.delays.messages
                            );
                        }
                        Logger.info(
                            `Sent user specific member anniversary messages for guild ${guild.name} (ID:${guild.id})`
                        );
                    }

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
                    Logger.info(
                        `Sending all member anniversary messages for guild ${guild.name} (ID:${guild.id})`
                    );
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
                    Logger.info(
                        `Sent all member anniversary messages for guild ${guild.name} (ID:${guild.id})`
                    );
                } catch (error) {
                    // Error when giving out member anniversary messages
                    Logger.error(
                        Logs.error.memberAnniversaryMessageServiceFailed
                            .replace('{GUILD_ID}', guild.id)
                            .replace('{GUILD_NAME}', guild.name),
                        error
                    );
                }
            }
        }
        Logger.info(
            `Finished member anniversary message service in ${
                (performance.now() - memberAnniversaryMesagePerformanceStart) / 1000
            }s`
        );

        let serverAnniversaryMesagePerformanceStart = performance.now();
        // Server Anniversary Messages
        if (serverAnniversaryMessageChannels.length > 0) {
            for (let serverAnniversaryChannel of serverAnniversaryMessageChannels) {
                let guild = serverAnniversaryChannel.guild;

                let guildCelebrationData = guildCelebrationDatas.find(
                    g => g.guildData.GuildDiscordId === guild.id
                );
                try {
                    let hasPremium = guildsWithPremium.includes(guild.id);

                    // Get our generic server anniversary message
                    let message = Lang.getRef('defaults.serverAnniversaryMessage', LangCode.EN_US);
                    let color = Config.colors.default;
                    let useEmbed = true;

                    // Get all server anniversary messages
                    let serverAnniversaryMessages = guildCelebrationData.customMessages.filter(
                        message =>
                            message.Type === 'serveranniversary' && message.UserDiscordId === '0'
                    );

                    // Get the mention string
                    let mentionString =
                        guildCelebrationData.guildData.ServerAnniversaryMentionSetting !== 'none'
                            ? CelebrationUtils.getMentionString(
                                  guildCelebrationData.guildData,
                                  guild,
                                  'serveranniversary'
                              )
                            : '';

                    let serverYears = CelebrationUtils.getServerYears(
                        guild,
                        guildCelebrationData.guildData
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
                    Logger.info(
                        `Sending server anniversary messages for guild ${guild.name} (ID:${guild.id})`
                    );
                    await MessageUtils.sendWithDelay(
                        serverAnniversaryChannel,
                        useEmbed ? embed : message,
                        Config.delays.messages
                    );
                    Logger.info(
                        `Sent server anniversary messages for guild ${guild.name} (ID:${guild.id})`
                    );
                } catch (error) {
                    // Error when giving out server anniversary messages
                    Logger.error(
                        Logs.error.serverAnniversaryMessageServiceFailed
                            .replace('{GUILD_ID}', guild.id)
                            .replace('{GUILD_NAME}', guild.name),
                        error
                    );
                }
            }
        }
        Logger.info(
            `Finished server anniversary message service in ${
                (performance.now() - serverAnniversaryMesagePerformanceStart) / 1000
            }s`
        );
    }
}
