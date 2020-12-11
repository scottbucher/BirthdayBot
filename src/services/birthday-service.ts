import { ActionUtils, BdayUtils, FormatUtils, MessageUtils, PermissionUtils } from '../utils';
import { Collection, Guild, GuildMember, MessageEmbed, Role, TextChannel } from 'discord.js';
import { GuildData, UserData } from '../models/database';

import { ColorUtils } from '../utils/color-utils';
import { CustomMessageRepo } from './database/repos';
import { PlanName } from '../models/subscription-models';
import { SubscriptionService } from './subscription-service';

let Config = require('../../config/config.json');

export class BirthdayService {
    constructor(
        private customMessageRepo: CustomMessageRepo,
        private subscriptionService: SubscriptionService
    ) {}

    public async celebrateBirthdays(
        guild: Guild,
        guildData: GuildData,
        userDatas: UserData[],
        members: Collection<string, GuildMember>,
        isTest: boolean = false,
        testChannel: TextChannel = null
    ): Promise<void> {
        let birthdayChannel: TextChannel;
        let birthdayRole: Role;
        let trustedRole: Role;

        let trustedCheckRole = false;
        let trustedCheckMessage = false;

        let testingEmbed = new MessageEmbed()
            .setThumbnail(guild.iconURL())
            .setTitle('Birthday Event Test - [BETA]')
            .setFooter(
                'This is the info from your latest birthday event test.',
                guild.client.user.avatarURL()
            )
            .setTimestamp()
            .setColor(Config.colors.default);

        try {
            birthdayChannel = guild.channels.resolve(
                guildData.BirthdayChannelDiscordId
            ) as TextChannel;
        } catch (error) {
            // No Birthday Channel
        }
        try {
            birthdayRole = guild.roles.resolve(guildData.BirthdayRoleDiscordId);
        } catch (error) {
            // No Birthday Channel
        }
        try {
            trustedRole = guild.roles.resolve(guildData.TrustedRoleDiscordId);
        } catch (error) {
            // No Birthday Channel
        }

        if (!guild.me.hasPermission('MANAGE_ROLES')) birthdayRole = null; // If I can't edit roles the birthday Role is essentially null since I can't give the role
        if (birthdayChannel && !PermissionUtils.canSend(birthdayChannel)) birthdayChannel = null; // If I can't message in the birthday channel it is essentially null since I can't send the birthday message

        if (!birthdayRole && !birthdayChannel) {
            // Skip guild
            if (!isTest) return;
        }

        let birthdayMessageUsers: GuildMember[] = [];

        let preventMessage = guildData.TrustedPreventsMessage;
        let preventRole = guildData.TrustedPreventsRole;

        for (let user of userDatas) {
            let member: GuildMember;
            try {
                member = guild.members.resolve(user.UserDiscordId);
            } catch (error) {
                // Can't find member?
                continue;
            }

            if (!member) continue;

            if (
                trustedRole &&
                preventMessage &&
                preventRole &&
                !member.roles.cache.has(trustedRole.id)
            ) {
                // For test cases
                trustedCheckMessage = true;
                trustedCheckRole = true;
                continue;
            }

            // Birthday role is actively given, no time check needed!
            if (birthdayRole) {
                if (!(trustedRole && preventRole && !member.roles.cache.has(trustedRole.id))) {
                    ActionUtils.giveRole(member, birthdayRole);
                } else {
                    // For test cases
                    trustedCheckRole = true;
                }
            }

            if (
                (isTest || BdayUtils.isTimeForBirthdayMessage(guildData.MessageTime, user)) &&
                birthdayChannel
            ) {
                if (!(trustedRole && preventMessage && !member.roles.cache.has(trustedRole.id))) {
                    birthdayMessageUsers.push(member);
                } else {
                    // For test cases
                    trustedCheckMessage = true;
                }
            }
        }

        // get a string array of the userData keys
        let userDataKeys = userDatas.map(userData => userData.UserDiscordId);

        // Filter OUT anyone whose in userData (whose birthday is today) (This list will then have the birthday role removed since it isn't their birthday)
        members = members.filter(member => !userDataKeys.includes(member.id));

        // Birthday role is actively taken, no time check needed!
        if (birthdayRole) {
            members
                .filter(member => member.roles.cache.has(birthdayRole.id))
                .forEach(member => {
                    ActionUtils.removeRole(member, birthdayRole);
                });
        }

        // Birthday Message
        if (birthdayMessageUsers.length > 0) {
            let hasPremium = Config.payments.enabled
                ? await this.subscriptionService.hasService(PlanName.premium1, guild.id)
                : false;
            let globalMessages = await this.customMessageRepo.getCustomMessages(guild.id);

            // Get a list of custom user-specific messages
            let userMessages = await this.customMessageRepo.getCustomUserMessages(guild.id);

            // Define variable
            let usersWithSpecificMessage: GuildMember[];

            // IF THEY HAVE PREMIUM
            if (hasPremium) {
                // Guild Member list of people with a user-specific custom birthday message
                usersWithSpecificMessage = birthdayMessageUsers.filter(member =>
                    userMessages.customMessages
                        .map(message => message.UserDiscordId)
                        .includes(member.id)
                );

                //  Remove all users who have a user-specific custom birthday message
                birthdayMessageUsers = birthdayMessageUsers.filter(
                    member => !usersWithSpecificMessage.includes(member)
                );
            }

            // Find mentioned role
            let mentionSetting: string;
            let roleInput: Role = guild.roles.resolve(guildData.MentionSetting);

            if (!roleInput || roleInput.guild.id !== guild.id) {
                if (
                    guildData.MentionSetting.toLowerCase() === 'everyone' ||
                    guildData.MentionSetting.toLowerCase() === 'here'
                ) {
                    mentionSetting = '@' + guildData.MentionSetting;
                }
            } else {
                mentionSetting = roleInput.toString();
            }

            // Send the mention setting
            if (mentionSetting) MessageUtils.send(birthdayChannel, mentionSetting);

            let color = guildData.MessageEmbedColor === '0' ? Config.colors.default : null;

            color =
                !color && hasPremium
                    ? '#' + ColorUtils.findHex(guildData.MessageEmbedColor) ?? Config.colors.default
                    : Config.colors.default;

            // Create and send the default or the global custom birthday message that was chosen for those without a user-specific custom birthday message
            if (birthdayMessageUsers.length > 0) {
                let userList: string;
                // Format the user list based off the servers name format
                if (guildData.NameFormat === 'mention')
                    FormatUtils.joinWithAnd(birthdayMessageUsers.map(user => user.toString()));
                else if (guildData.NameFormat === 'username')
                    FormatUtils.joinWithAnd(birthdayMessageUsers.map(user => user.user.username));
                else if (guildData.NameFormat === 'nickname')
                    FormatUtils.joinWithAnd(birthdayMessageUsers.map(user => user.nickname));
                else if (guildData.NameFormat === 'tag')
                    FormatUtils.joinWithAnd(
                        birthdayMessageUsers.map(
                            user => `${user.user.username}#${user.user.discriminator}`
                        )
                    );

                let message = BdayUtils.randomMessage(globalMessages, hasPremium)
                    .split('@Users')
                    .join(userList)
                    .split('<Users>')
                    .join(userList);

                let embed = new MessageEmbed().setDescription(message).setColor(color);
                await MessageUtils.send(birthdayChannel, guildData.UseEmbed ? embed : message);
            }

            if (hasPremium) {
                // Now, loop through the members with a user-specific custom birthday message
                for (let member of usersWithSpecificMessage) {
                    // Get their birthday message
                    let message = userMessages.customMessages
                        .find(message => message.UserDiscordId === member.user.id)
                        .Message.split('@Users')
                        .join(member.toString())
                        .split('<Users>')
                        .join(member.toString());

                    // Create it and send it
                    let embed = new MessageEmbed().setDescription(message).setColor(color);
                    await MessageUtils.send(birthdayChannel, guildData.UseEmbed ? embed : message);
                }
            }
        }

        if (isTest) {
            let member = guild.members.resolve(userDatas[0].UserDiscordId);
            if (trustedRole) {
                testingEmbed.addField(
                    'User Has Trusted Role',
                    `${
                        member.roles.cache.has(trustedRole.id)
                            ? `${Config.emotes.confirm} Yes.`
                            : `${Config.emotes.deny} No.`
                    }`,
                    true
                );
            }
            testingEmbed.addField(
                'Birthday Role',
                `${
                    birthdayRole
                        ? `${Config.emotes.confirm} Correctly set.`
                        : `${Config.emotes.deny} Not set or is a deleted role.`
                }`,
                true
            );
            if (trustedRole) {
                testingEmbed.addField(
                    'Trusted Prevents Role',
                    `${
                        !trustedCheckRole
                            ? `${Config.emotes.confirm} Passed.`
                            : `${Config.emotes.deny} Trusted role/settings prevented the birthday role.`
                    }`,
                    true
                );
            }
            testingEmbed.addField(
                'Birthday Channel',
                `${
                    birthdayChannel
                        ? `${Config.emotes.confirm} Correctly set.`
                        : `${Config.emotes.deny} Not set or is a deleted channel.`
                }`,
                true
            );
            if (trustedRole) {
                testingEmbed.addField(
                    'Trusted Prevents Message',
                    `${
                        !trustedCheckMessage
                            ? `${Config.emotes.confirm} Passed.`
                            : `${Config.emotes.deny} Trusted role/settings prevented the birthday message.`
                    }`,
                    true
                );
            }
            testingEmbed.addField(
                'Birthday Blacklist',
                `${Config.emotes.confirm} Member is not blacklisted.`,
                true
            );

            testingEmbed.setDescription(
                'Below are the checks to ensure your settings are correct for the birthday event.\n\nIf the checks are passed and either the birthday message and/or birthday role were not given ' +
                    `when they should have then ${guild.client.user.toString()} most likely did not have the correct permissions. [(?)](${
                        Config.links.docs
                    }/faq)\n\nFor more help: [Join Support Server](${Config.links.support})`
            );

            if (testChannel) {
                await MessageUtils.send(testChannel, testingEmbed);
            }
        }
    }
}
