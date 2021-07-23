import { ActionUtils, CelebrationUtils, MessageUtils } from '../utils';
import { Client, Guild, GuildMember, MessageEmbed, Role, TextChannel } from 'discord.js';
import { GuildCelebrationData, MemberAnniversaryRole, UserData } from '../models/database';

import { Logger } from '.';

let Config = require('../../config/config.json');
let Logs = require('../../lang/logs.json');

export class CelebrationService {
    // TODO: add to config
    public async run(
        guild: Guild,
        guildCelebrationData: GuildCelebrationData,
        userData: UserData[],
        guildMembers: GuildMember[],
        hasPremium: boolean
    ): Promise<void> {
        try {
            let guildData = guildCelebrationData.guildData;
            let birthdayChannel: TextChannel;
            let memberAnniversaryChannel: TextChannel;
            let serverAnniversaryChannel: TextChannel;
            let birthdayRole: Role;

            ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            // BIRTHDAY SYSTEM
            ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            try {
                if (guildData.BirthdayChannelDiscordId !== '0') {
                    try {
                        birthdayChannel = guild.channels.resolve(
                            guildData.BirthdayChannelDiscordId
                        ) as TextChannel;
                    } catch (error) {
                        // No birthday channel
                    }
                }

                if (guildData.BirthdayRoleDiscordId !== '0') {
                    try {
                        birthdayRole = guild.roles.resolve(guildData.BirthdayRoleDiscordId) as Role;
                    } catch (error) {
                        // No Birthday Role
                    }
                }

                // If either are set we have to calculate birthday information
                if (birthdayChannel || birthdayRole) {
                    // Get a list of memberIds
                    let memberIds = guildMembers.map(member => member.id);

                    // Get the blacklist data for this guild
                    let blacklistData = guildCelebrationData.blacklistedMembers.map(
                        m => m.UserDiscordId
                    );

                    // Remove members who are not apart of this guild and who are in the birthday blacklist
                    let memberUserDatas = userData.filter(
                        userData =>
                            memberIds.includes(userData.UserDiscordId) &&
                            !blacklistData.includes(userData.UserDiscordId)
                    );

                    let membersWithBirthdayTodayOrTomorrow = guildMembers.filter(member =>
                        CelebrationUtils.isBirthdayTodayOrYesterday(
                            memberUserDatas.find(data => data.UserDiscordId === member.id),
                            guildData
                        )
                    );

                    let birthdayMemberStatuses = membersWithBirthdayTodayOrTomorrow.map(m =>
                        CelebrationUtils.getBirthdayMemberStatus(
                            memberUserDatas.find(data => data.UserDiscordId === m.id),
                            m,
                            guildData
                        )
                    );

                    let trustedRoles: Role[];

                    // If trusted prevents the role and there are trusted roles in the database lets try to resolve them
                    if (
                        (guildData.TrustedPreventsRole || guildData.TrustedPreventsMessage) &&
                        guildCelebrationData.trustedRoles.length > 0
                    ) {
                        trustedRoles = await CelebrationUtils.getTrustedRoleList(
                            guild,
                            guildCelebrationData.trustedRoles
                        );
                    }

                    // Filter for those who need the message and pass the trusted check
                    let membersWhoNeedMessage = birthdayMemberStatuses
                        .filter(
                            m =>
                                m.needsMessage &&
                                (!trustedRoles ||
                                    trustedRoles.length > 0 ||
                                    CelebrationUtils.passesTrustedCheck(
                                        guildCelebrationData.guildData.RequireAllTrustedRoles,
                                        trustedRoles,
                                        m.member,
                                        guildData.TrustedPreventsMessage,
                                        hasPremium
                                    ))
                        )
                        .map(m => m.member);

                    // Filter for those who need the role added/removed and pass the trusted check
                    let membersWhoNeedRole = birthdayMemberStatuses.filter(
                        m =>
                            (m.needsRoleAdded || m.needsRoleRemoved) &&
                            (!trustedRoles ||
                                trustedRoles.length > 0 ||
                                CelebrationUtils.passesTrustedCheck(
                                    guildCelebrationData.guildData.RequireAllTrustedRoles,
                                    trustedRoles,
                                    m.member,
                                    guildData.TrustedPreventsMessage,
                                    hasPremium
                                ))
                    );

                    if (birthdayChannel && membersWhoNeedMessage.length > 0) {
                        // Send messages

                        // Get all regular birthday messages
                        let birthdayMessages = guildCelebrationData.customMessages.filter(
                            message => message.Type === 'birthday' && message.UserDiscordId === '0'
                        );

                        let userSpecificMessagesToSend = [];

                        if (hasPremium) {
                            // All messages with a user id (and where that user id exists in our birthday guild member list) is a user specific message
                            let memberIds = membersWhoNeedMessage.map(member => member.id);
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
                            let birthdayMembersUserSpecific: GuildMember[] =
                                membersWhoNeedMessage.filter(member =>
                                    userSpecificMessageIds.includes(member.id)
                                );

                            // Now update the original list by removing guildMembers in the user specific list
                            membersWhoNeedMessage = membersWhoNeedMessage.filter(
                                birthday => !birthdayMembersUserSpecific.includes(birthday)
                            );

                            for (let birthdayMember of birthdayMembersUserSpecific) {
                                userSpecificMessagesToSend.push(
                                    CelebrationUtils.getUserSpecificCelebrationMessage(
                                        guild,
                                        guildData,
                                        birthdayUserSpecificMessages.find(
                                            m => m.UserDiscordId === birthdayMember.id
                                        ),
                                        birthdayMember,
                                        null,
                                        hasPremium
                                    )
                                );
                            }
                        }

                        let genericBirthdayMessage: MessageEmbed | string;

                        if (membersWhoNeedMessage.length > 0) {
                            genericBirthdayMessage = CelebrationUtils.getCelebrationMessage(
                                guild,
                                guildData,
                                birthdayMessages,
                                'birthday',
                                membersWhoNeedMessage,
                                null,
                                hasPremium
                            );
                        }

                        if (userSpecificMessagesToSend.length > 0 || genericBirthdayMessage) {
                            // Get the mention string
                            let mentionString =
                                guildCelebrationData.guildData.BirthdayMentionSetting !== 'none'
                                    ? CelebrationUtils.getMentionString(
                                          guildCelebrationData.guildData,
                                          guild,
                                          'birthday'
                                      )
                                    : '';
                            // Only send one mention string per celebration message type
                            if (mentionString && mentionString !== '')
                                await MessageUtils.send(birthdayChannel, mentionString);
                        }

                        if (userSpecificMessagesToSend.length > 0) {
                            Logger.info(
                                `Sending user specific birthday messages for guild ${guild.name} (ID:${guild.id})`
                            );
                            for (let message of userSpecificMessagesToSend) {
                                await MessageUtils.sendWithDelay(
                                    birthdayChannel,
                                    message,
                                    Config.delays.messages
                                );
                            }
                            Logger.info(
                                `Sent user specific birthday messages for guild ${guild.name} (ID:${guild.id})`
                            );
                        }

                        if (genericBirthdayMessage) {
                            Logger.info(
                                `Sending birthday message for guild ${guild.name} (ID:${guild.id})`
                            );
                            await MessageUtils.sendWithDelay(
                                birthdayChannel,
                                genericBirthdayMessage,
                                Config.delays.messages
                            );
                            Logger.info(
                                `Sent birthday message for guild ${guild.name} (ID:${guild.id})`
                            );
                        }
                    }

                    if (birthdayRole && membersWhoNeedRole.length > 0) {
                        // Give/Take roles
                        for (let birthdayMemberStatus of membersWhoNeedRole) {
                            if (birthdayMemberStatus.needsRoleAdded) {
                                // Give the role
                                await ActionUtils.giveRole(
                                    birthdayMemberStatus.member,
                                    birthdayRole,
                                    Config.delays.roles
                                );
                            } else {
                                // Remove the role
                                await ActionUtils.removeRole(
                                    birthdayMemberStatus.member,
                                    birthdayRole,
                                    Config.delays.roles
                                );
                            }
                        }
                    }
                }
            } catch (error) {
                // Error when running the birthday system for this guild
                Logger.error(
                    Logs.error.birthdaySystemFailedForGuild
                        .replace('{GUILD_ID}', guildData.GuildDiscordId)
                        .replace('{GUILD_NAME}', guild.name)
                        .replace('{MEMBER_COUNT}', guild.memberCount.toLocaleString())
                        .replace('{MEMBER_CACHE_COUNT}', guild.members.cache.size.toLocaleString()),
                    error
                );
            }

            ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            // MEMBER ANNIVERSARY SYSTEM
            ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            try {
                if (guildData.MemberAnniversaryChannelDiscordId !== '0') {
                    try {
                        memberAnniversaryChannel = guild.channels.resolve(
                            guildData.MemberAnniversaryChannelDiscordId
                        ) as TextChannel;
                    } catch (error) {
                        // No member anniversary channel
                    }
                }

                // Get the member anniversaries for this guild if they have premium
                let memberAnniversaryRoles: MemberAnniversaryRole[];

                if (hasPremium) {
                    memberAnniversaryRoles = guildCelebrationData?.anniversaryRoles;
                }

                if (
                    memberAnniversaryChannel ||
                    (memberAnniversaryRoles && memberAnniversaryRoles.length > 0)
                ) {
                    let anniversaryMemberStatuses = guildMembers.map(m =>
                        CelebrationUtils.getAnniversaryMemberStatuses(
                            m,
                            guildData,
                            memberAnniversaryRoles
                        )
                    );

                    if (memberAnniversaryChannel && anniversaryMemberStatuses.length > 0) {
                        // Send Member Anniversary Messages
                        let membersWhoNeedMessage = anniversaryMemberStatuses
                            .filter(m => m.needsMessage)
                            .map(m => m.member);

                        if (membersWhoNeedMessage.length > 0) {
                            // Get all regular birthday messages
                            let memberAnniversaryMessages =
                                guildCelebrationData.customMessages.filter(
                                    message =>
                                        message.Type === 'memberanniversary' &&
                                        message.UserDiscordId === '0'
                                );

                            let userSpecificMessagesToSend = [];

                            if (hasPremium) {
                                // User Specific Messages
                                // All messages with a user id (and where that user id exists in our birthday guild member list) is a user specific message
                                let memberIds = membersWhoNeedMessage.map(member => member.id);
                                let memberAnniversaryUserSpecificMessages =
                                    guildCelebrationData.customMessages.filter(
                                        message =>
                                            message.Type === 'memberanniversary' &&
                                            message.UserDiscordId !== '0' &&
                                            memberIds.includes(message.UserDiscordId)
                                    );

                                // Map to a user id string array
                                let userSpecificMessageIds =
                                    memberAnniversaryUserSpecificMessages.map(
                                        message => message.UserDiscordId
                                    );

                                // List of members with a user specific message
                                let memberAnniversaryMembersUserSpecific: GuildMember[] =
                                    membersWhoNeedMessage.filter(member =>
                                        userSpecificMessageIds.includes(member.id)
                                    );

                                // Now update the original list by removing guildMembers in the user specific list
                                membersWhoNeedMessage = membersWhoNeedMessage.filter(
                                    anniversary =>
                                        !memberAnniversaryMembersUserSpecific.includes(anniversary)
                                );

                                for (let memberAnniversaryMember of memberAnniversaryMembersUserSpecific) {
                                    userSpecificMessagesToSend.push(
                                        CelebrationUtils.getUserSpecificCelebrationMessage(
                                            guild,
                                            guildData,
                                            memberAnniversaryUserSpecificMessages.find(
                                                m => m.UserDiscordId === memberAnniversaryMember.id
                                            ),
                                            memberAnniversaryMember,
                                            null,
                                            hasPremium
                                        )
                                    );
                                }
                            }

                            // Get an array of year values (Use set to remove duplicates)
                            let differentYears = [
                                ...new Set(
                                    membersWhoNeedMessage.map(data =>
                                        CelebrationUtils.getMemberYears(data, guildData)
                                    )
                                ),
                            ];
                            let regularMessagesToSend: string[] = [];
                            let embedMessagesToSend: MessageEmbed[] = [];

                            for (let year of differentYears) {
                                let message = CelebrationUtils.getCelebrationMessage(
                                    guild,
                                    guildData,
                                    memberAnniversaryMessages,
                                    'memberanniversary',
                                    membersWhoNeedMessage,
                                    year,
                                    hasPremium
                                );

                                if (message instanceof MessageEmbed) {
                                    embedMessagesToSend.push(message);
                                } else {
                                    regularMessagesToSend.push(message);
                                }
                            }

                            if (
                                regularMessagesToSend.length > 0 ||
                                embedMessagesToSend.length > 0 ||
                                userSpecificMessagesToSend.length > 0
                            ) {
                                // Get the mention string
                                let mentionString =
                                    guildCelebrationData.guildData
                                        .MemberAnniversaryMentionSetting !== 'none'
                                        ? CelebrationUtils.getMentionString(
                                              guildCelebrationData.guildData,
                                              guild,
                                              'memberanniversary'
                                          )
                                        : '';
                                if (mentionString && mentionString !== '')
                                    await MessageUtils.send(
                                        memberAnniversaryChannel,
                                        mentionString
                                    );

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
                                        if (
                                            regularMessages[counter].concat('\n\n' + message)
                                                .length > 4096
                                        ) {
                                            counter++;
                                            regularMessages.push(message);
                                        } else {
                                            regularMessages[counter] = regularMessages[
                                                counter
                                            ].concat('\n\n' + message);
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
                                                new MessageEmbed()
                                                    .setColor(color)
                                                    .setDescription(message)
                                            );
                                        } else if (
                                            embedMessages[counter].description.concat(
                                                '\n\n' + message
                                            ).length > 4096
                                        ) {
                                            counter++;
                                            embedMessages.push(
                                                new MessageEmbed()
                                                    .setDescription(message)
                                                    .setColor(color)
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
                            }
                        }
                    }

                    if (memberAnniversaryRoles && memberAnniversaryRoles.length > 0) {
                        // Give Member Anniversary Roles
                        let statuses = anniversaryMemberStatuses.filter(r => r.role);
                        let giveRoles = [...new Set(statuses.map(m => m.role))];

                        for (let role of giveRoles) {
                            let membersWhoNeedsThisRole = statuses
                                .filter(m => m.role === role)
                                .map(m => m.member);
                            // Give Anniversary Roles
                            for (let memberWhoNeedsThisRole of membersWhoNeedsThisRole) {
                                await ActionUtils.giveRole(
                                    memberWhoNeedsThisRole,
                                    role,
                                    Config.delays.roles
                                );
                            }
                        }
                    }
                }
            } catch (error) {
                // Error when running the member anniversary system for this guild
                Logger.error(
                    Logs.error.memberAnniversarySystemFailedForGuild
                        .replace('{GUILD_ID}', guildData.GuildDiscordId)
                        .replace('{GUILD_NAME}', guild.name)
                        .replace('{MEMBER_COUNT}', guild.memberCount.toLocaleString())
                        .replace('{MEMBER_CACHE_COUNT}', guild.members.cache.size.toLocaleString()),
                    error
                );
            }

            ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            // SERVER ANNIVERSARY SYSTEM
            ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            try {
                if (guildData.ServerAnniversaryChannelDiscordId !== '0') {
                    try {
                        serverAnniversaryChannel = guild.channels.resolve(
                            guildData.ServerAnniversaryChannelDiscordId
                        ) as TextChannel;
                    } catch (error) {
                        // No server anniversary channel
                    }

                    if (
                        serverAnniversaryChannel &&
                        CelebrationUtils.isServerAnniversaryMessage(guild, guildData)
                    ) {
                        let serverAnniversaryMessages = guildCelebrationData.customMessages.filter(
                            message =>
                                message.Type === 'serveranniversary' &&
                                message.UserDiscordId === '0'
                        );
                        // Give Server Anniversary Message
                        let message = CelebrationUtils.getCelebrationMessage(
                            guild,
                            guildData,
                            serverAnniversaryMessages,
                            'serveranniversary',
                            null,
                            CelebrationUtils.getServerYears(guild, guildData),
                            hasPremium
                        );

                        if (message) {
                            Logger.info(
                                `Sending server anniversary message for guild ${guild.name} (ID:${guild.id})`
                            );
                            await MessageUtils.sendWithDelay(
                                serverAnniversaryChannel,
                                message,
                                Config.delays.messages
                            );
                            Logger.info(
                                `Sent server anniversary message for guild ${guild.name} (ID:${guild.id})`
                            );
                        }
                    }
                }
            } catch (error) {
                // Error when running the server anniversary system
                Logger.error(
                    Logs.error.serverAnniversarySystemFailedForGuild
                        .replace('{GUILD_ID}', guildData.GuildDiscordId)
                        .replace('{GUILD_NAME}', guild.name)
                        .replace('{MEMBER_COUNT}', guild.memberCount.toLocaleString())
                        .replace('{MEMBER_CACHE_COUNT}', guild.members.cache.size.toLocaleString()),
                    error
                );
            }
        } catch (error) {
            // Error while running the celebration service for this guild
        }
    }
}
