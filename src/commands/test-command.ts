import {
    ActionUtils,
    CelebrationUtils,
    FormatUtils,
    GuildUtils,
    MessageUtils,
    ParseUtils,
    PermissionUtils,
} from '../utils';
import {
    BlacklistRepo,
    CustomMessageRepo,
    GuildRepo,
    MemberAnniversaryRoleRepo,
    TrustedRoleRepo,
    UserRepo,
} from '../services/database/repos';
import { CustomMessage, UserData } from '../models/database';
import { Message, MessageEmbed, Role, TextChannel, User } from 'discord.js';

import { Command } from './command';
import { Lang } from '../services';
import { LangCode } from '../models/enums';
import { MemberAnniversaryRole } from '../models/database/member-anniversary-role-models';

let Config = require('../../config/config.json');

export class TestCommand implements Command {
    public name: string = 'test';
    public aliases = ['tst'];
    public requireSetup = true;
    public guildOnly = true;
    public adminOnly = true;
    public ownerOnly = false;
    public voteOnly = false;
    public requirePremium = false;
    public getPremium = true;

    constructor(
        private guildRepo: GuildRepo,
        private userRepo: UserRepo,
        private customMessageRepo: CustomMessageRepo,
        private trustedRoleRepo: TrustedRoleRepo,
        private blacklistRepo: BlacklistRepo,
        private memberAnniversaryRoleRepo: MemberAnniversaryRoleRepo
    ) {}

    public async execute(
        args: string[],
        msg: Message,
        channel: TextChannel,
        hasPremium: boolean
    ): Promise<void> {
        // bday test <type> [user] [year]
        let guild = msg.guild;

        if (args.length < 3) {
            MessageUtils.send(
                channel,
                Lang.getEmbed('validation.invalidCelebrationType', LangCode.EN_US, {
                    ICON: msg.client.user.avatarURL(),
                })
            );
            return;
        }

        let type = FormatUtils.extractCelebrationType(args[2].toLowerCase());

        if (!type) {
            MessageUtils.send(
                channel,
                Lang.getEmbed('validation.invalidCelebrationType', LangCode.EN_US, {
                    ICON: msg.client.user.avatarURL(),
                })
            );
            return;
        }

        let target: User;
        let year = 0;
        let userData: UserData;

        if (args.length >= 4) {
            // Get who they are mentioning
            target =
                msg.mentions.members.first()?.user ||
                GuildUtils.findMember(msg.guild, args[3])?.user ||
                (args.length >= 5 && GuildUtils.findMember(msg.guild, args[4])?.user);

            // Did we find a user?
            if (!target) {
                try {
                    year = ParseUtils.parseInt(args[3]);
                } catch (error) {
                    if (args.length >= 5) {
                        try {
                            year = ParseUtils.parseInt(args[4]);
                        } catch (error) {
                            // no year
                        }
                    }
                }
            }
            userData = await this.userRepo.getUser(target.id);
        }

        // Default target to bot for the test
        if (!target) target = msg.client.user;

        let guildData = await this.guildRepo.getGuild(msg.guild.id);

        let messageChannel: TextChannel;

        try {
            messageChannel = guild.channels.resolve(
                type === 'birthday'
                    ? guildData.BirthdayChannelDiscordId
                    : type === 'memberanniversary'
                    ? guildData.MemberAnniversaryChannelDiscordId
                    : guildData.ServerAnniversaryChannelDiscordId
            ) as TextChannel;
        } catch (error) {
            // No birthday channel
        }

        let customMessages: CustomMessage[];
        let mentionString = CelebrationUtils.getMentionString(guildData, guild, type);

        if (type === 'birthday') {
            // run the birthday test

            // If a check is true, it "passes" (we are trying to pass all checks)
            // example: blackListCheck false means the user was IN the blacklist
            let roleCheck = false;
            let messageCheck = PermissionUtils.canSend(messageChannel);
            let trustedCheckMessage = false;
            let trustedCheckRole = false;
            let trustedPreventsMessage = guildData.TrustedPreventsMessage;
            let trustedPreventsRole = guildData.TrustedPreventsRole;
            let birthdayCheck = target.bot ? true : userData.Birthday;
            let blacklistCheck = false;

            let message = Lang.getRef('defaults.birthdayMessage', LangCode.EN_US);
            let color = Config.colors.default;
            let useEmbed = true;

            // Get the blacklist data for this guild
            let blacklistData = await this.blacklistRepo.getBlacklist(guild.id);

            blacklistCheck = !blacklistData.blacklist
                .map(data => data.UserDiscordId)
                .includes(target.id);

            // Get the birthday role for this guild
            let birthdayRole: Role;
            try {
                birthdayRole = guild.roles.resolve(guildData.BirthdayRoleDiscordId) as Role;
            } catch (error) {
                // No Birthday Role
            }

            // See if the bot can give the roles
            let guildMember = guild.members.resolve(target);
            roleCheck = CelebrationUtils.canGiveAllRoles(guild, [birthdayRole], guildMember);

            // Get the trusted roles for this guild using our celebration utils
            let trustedRoles = await this.trustedRoleRepo.getTrustedRoles(guild.id);
            let trustedRoleList: Role[] = await CelebrationUtils.getTrustedRoleList(
                guild,
                trustedRoles.trustedRoles
            );

            // Get our trusted checks for each using celebration utils
            trustedCheckRole = CelebrationUtils.passesTrustedCheck(
                guildData.RequireAllTrustedRoles,
                trustedRoleList,
                guildMember,
                trustedPreventsRole,
                hasPremium
            );
            trustedCheckMessage = CelebrationUtils.passesTrustedCheck(
                guildData.RequireAllTrustedRoles,
                trustedRoleList,
                guildMember,
                trustedPreventsMessage,
                hasPremium
            );

            // Check for user specific messages
            if (target.bot) {
                customMessages = (
                    await this.customMessageRepo.getCustomUserMessages(guild.id, 'birthday')
                ).customMessages.filter(message => message.UserDiscordId === target.id);
            }

            // if we never looked for them or there were none to match this user then lets get regular custom birthday messages
            if (!customMessages || customMessages.length === 0)
                customMessages = (
                    await this.customMessageRepo.getCustomMessages(guild.id, 'birthday')
                ).customMessages;

            if (blacklistCheck && birthdayCheck) {
                if (roleCheck && trustedCheckRole) {
                    await ActionUtils.giveRole(guildMember, birthdayRole);
                }

                if (messageCheck && trustedCheckRole) {
                    let userList = CelebrationUtils.getUserListString(guildData, [guildMember]);

                    if (customMessages.length > 0) {
                        // Get our custom message
                        let customMessage = CelebrationUtils.randomMessage(
                            customMessages,
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
                        type,
                        userList,
                        null
                    );

                    // Send our message(s)
                    if (mentionString && mentionString !== '')
                        await MessageUtils.send(messageChannel, mentionString);

                    let embed = new MessageEmbed().setDescription(message).setColor(color);
                    await MessageUtils.send(messageChannel, useEmbed ? embed : message);
                }
            }

            ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            // Give Test Result Message
            ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            let testingEmbed = Lang.getEmbed('results.birthdayTest', LangCode.EN_US, {
                ICON: msg.client.user.avatarURL(),
            })
                .setColor(Config.colors.default)
                .addField(
                    Lang.getRef('terms.birthdayChannel', LangCode.EN_US),
                    messageCheck
                        ? `${Config.emotes.confirm} ${Lang.getRef(
                              'terms.correctlySet',
                              LangCode.EN_US
                          )}`
                        : `${Config.emotes.deny} ${Lang.getRef(
                              'terms.notSetOrIncorrect',
                              LangCode.EN_US
                          )}`,
                    true
                )
                .addField(
                    Lang.getRef('terms.birthdayRole', LangCode.EN_US),
                    roleCheck
                        ? `${Config.emotes.confirm} ${Lang.getRef(
                              'terms.correctlySet',
                              LangCode.EN_US
                          )}`
                        : `${Config.emotes.deny} ${Lang.getRef(
                              'terms.notSetOrIncorrect',
                              LangCode.EN_US
                          )}`,
                    true
                );

            if (blacklistData.blacklist.length > 0) {
                testingEmbed.addField(
                    Lang.getRef('terms.memberInBlacklist', LangCode.EN_US),
                    trustedCheckMessage
                        ? `${Config.emotes.confirm} ${Lang.getRef(
                              'terms.notInBlacklist',
                              LangCode.EN_US
                          )}`
                        : `${Config.emotes.deny} ${Lang.getRef(
                              'terms.inBlacklist',
                              LangCode.EN_US
                          )}`,
                    true
                );
            }

            if (trustedRoles.trustedRoles.length > 0) {
                testingEmbed.addField(
                    Lang.getRef('terms.trustedPreventMsg', LangCode.EN_US),
                    trustedCheckMessage
                        ? `${Config.emotes.confirm} ${Lang.getRef(
                              'terms.didntPreventMsg',
                              LangCode.EN_US
                          )}`
                        : `${Config.emotes.deny} ${Lang.getRef(
                              'terms.didPreventMsg',
                              LangCode.EN_US
                          )}`,
                    true
                );
                testingEmbed.addField(
                    Lang.getRef('terms.trustedPreventRole', LangCode.EN_US),
                    trustedCheckRole
                        ? `${Config.emotes.confirm} ${Lang.getRef(
                              'terms.didntPreventRole',
                              LangCode.EN_US
                          )}`
                        : `${Config.emotes.deny} ${Lang.getRef(
                              'terms.didPreventRole',
                              LangCode.EN_US
                          )}`,
                    true
                );
            }
            await MessageUtils.send(channel, testingEmbed);
            return;
        } else if (type === 'memberanniversary') {
            // run the member anniversary test

            // If a check is true, it "passes" (we are trying to pass all checks)
            // example: blackListCheck false means the user was IN the blacklist
            let messageCheck = PermissionUtils.canSend(messageChannel);
            let memberAnniversaryRolesCheck = false;
            let memberAnniversaryRoles: MemberAnniversaryRole[];
            let anniversaryResolvedRoles: Role[];

            let message = Lang.getRef('defaults.memberAnniversaryMessage', LangCode.EN_US);
            let color = Config.colors.default;
            let useEmbed = true;
            let guildMember = guild.members.resolve(target);

            let timezoneCheck = guildData?.DefaultTimezone !== '0';

            // Only premium guilds get anniversary roles
            if (hasPremium) {
                memberAnniversaryRoles = (
                    await this.memberAnniversaryRoleRepo.getMemberAnniversaryRoles(guild.id)
                ).memberAnniversaryRoles;
                // Get our list of anniversary roles
                anniversaryResolvedRoles = await CelebrationUtils.getMemberAnniversaryRoleList(
                    guild,
                    memberAnniversaryRoles
                );

                // Get the data of the roles we could resolve (we need the data so we can check years later!)
                memberAnniversaryRoles = memberAnniversaryRoles.filter(data =>
                    anniversaryResolvedRoles
                        .map(r => r.id)
                        .includes(data.MemberAnniversaryRoleDiscordId)
                );

                // See if the bot can give the roles
                memberAnniversaryRolesCheck =
                    CelebrationUtils.canGiveAllRoles(
                        guild,
                        anniversaryResolvedRoles,
                        guildMember
                    ) && year !== 0;
            }

            // Check for user specific messages
            if (target.bot) {
                customMessages = (
                    await this.customMessageRepo.getCustomUserMessages(
                        guild.id,
                        'memberanniversary'
                    )
                ).customMessages.filter(message => message.UserDiscordId === target.id);
            }

            // if we never looked for them or there were none to match this user then lets get regular custom birthday messages
            if (!customMessages || customMessages.length === 0)
                customMessages = (
                    await this.customMessageRepo.getCustomMessages(guild.id, 'memberanniversary')
                ).customMessages;

            if (anniversaryResolvedRoles) {
                for (let role of anniversaryResolvedRoles) {
                    let roleData = memberAnniversaryRoles.find(
                        data => data.MemberAnniversaryRoleDiscordId === role.id
                    );

                    if (roleData.Year === year) {
                        await ActionUtils.giveRole(guildMember, role);
                    }
                }
            }
            if (messageCheck) {
                let userList = CelebrationUtils.getUserListString(guildData, [guildMember]);

                if (customMessages.length > 0) {
                    // Get our custom message
                    let customMessage = CelebrationUtils.randomMessage(customMessages, hasPremium);
                    // Find the color of the embed
                    color = CelebrationUtils.getMessageColor(customMessage, hasPremium);
                    useEmbed = customMessage.Embed ? true : false;

                    message = customMessage.Message;
                }

                // Replace the placeholders
                message = CelebrationUtils.replacePlaceHolders(
                    message,
                    guild,
                    type,
                    userList,
                    year === 0 ? 1 : year
                );

                // Send our message(s)
                if (mentionString && mentionString !== '')
                    await MessageUtils.send(messageChannel, mentionString);

                let embed = new MessageEmbed().setDescription(message).setColor(color);
                await MessageUtils.send(messageChannel, useEmbed ? embed : message);
            }

            ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            // Give Test Result Message
            ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            let testingEmbed = Lang.getEmbed('results.memberAnniversaryTest', LangCode.EN_US, {
                ICON: msg.client.user.avatarURL(),
            })
                .addField(
                    Lang.getRef('terms.defaultTimezone', LangCode.EN_US),
                    timezoneCheck
                        ? `${Config.emotes.confirm} ${Lang.getRef(
                              'terms.correctlySet',
                              LangCode.EN_US
                          )}`
                        : `${Config.emotes.deny} ${Lang.getRef('terms.notSet', LangCode.EN_US)}`,
                    true
                )
                .addField(
                    Lang.getRef('terms.memberAnniversaryChannel', LangCode.EN_US),
                    messageCheck
                        ? `${Config.emotes.confirm} ${Lang.getRef(
                              'terms.correctlySet',
                              LangCode.EN_US
                          )}`
                        : `${Config.emotes.deny} ${Lang.getRef(
                              'terms.notSetOrIncorrect',
                              LangCode.EN_US
                          )}`,
                    true
                );

            if (hasPremium && memberAnniversaryRoles.length > 0) {
                testingEmbed.addField(
                    Lang.getRef('terms.memberAnniversaryRoles', LangCode.EN_US),
                    memberAnniversaryRolesCheck
                        ? `${Config.emotes.confirm} ${Lang.getRef(
                              'terms.canBeGiven',
                              LangCode.EN_US
                          )}`
                        : `${Config.emotes.deny} ${Lang.getRef(
                              'terms.cantBeGivenPermIssue',
                              LangCode.EN_US
                          )}`,
                    true
                );
            }
            await MessageUtils.send(channel, testingEmbed);
            return;
        } else {
            // run the server anniversary test

            // If a check is true, it "passes" (we are trying to pass all checks)
            // example: blackListCheck false means the user was IN the blacklist
            let messageCheck = PermissionUtils.canSend(messageChannel);

            let message = Lang.getRef('defaults.serverAnniversaryMessage', LangCode.EN_US);
            let color = Config.colors.default;
            let useEmbed = true;

            let timezoneCheck = guildData?.DefaultTimezone !== '0';

            customMessages = (
                await this.customMessageRepo.getCustomMessages(guild.id, 'serveranniversary')
            ).customMessages;

            if (messageCheck) {
                if (customMessages.length > 0) {
                    // Get our custom message
                    let customMessage = CelebrationUtils.randomMessage(customMessages, hasPremium);
                    // Find the color of the embed
                    color = CelebrationUtils.getMessageColor(customMessage, hasPremium);
                    useEmbed = customMessage.Embed ? true : false;

                    message = customMessage.Message;
                }

                // Replace the placeholders
                message = CelebrationUtils.replacePlaceHolders(
                    message,
                    guild,
                    type,
                    target.toString(),
                    year === 0 ? 1 : year
                );

                // Send our message(s)
                if (mentionString && mentionString !== '')
                    await MessageUtils.send(messageChannel, mentionString);

                let embed = new MessageEmbed().setDescription(message).setColor(color);
                await MessageUtils.send(messageChannel, useEmbed ? embed : message);
            }

            ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            // Give Test Result Message
            ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            let testingEmbed = Lang.getEmbed('results.serverAnniversaryTest', LangCode.EN_US, {
                ICON: msg.client.user.avatarURL(),
            })
                .addField(
                    Lang.getRef('terms.defaultTimezone', LangCode.EN_US),
                    timezoneCheck
                        ? `${Config.emotes.confirm} ${Lang.getRef(
                              'terms.correctlySet',
                              LangCode.EN_US
                          )}`
                        : `${Config.emotes.deny} ${Lang.getRef('terms.notSet', LangCode.EN_US)}`,
                    true
                )
                .addField(
                    Lang.getRef('terms.serverAnniversaryChannel', LangCode.EN_US),
                    timezoneCheck
                        ? `${Config.emotes.confirm} ${Lang.getRef(
                              'terms.correctlySet',
                              LangCode.EN_US
                          )}`
                        : `${Config.emotes.deny} ${Lang.getRef(
                              'terms.notSetOrIncorrect',
                              LangCode.EN_US
                          )}`,
                    true
                );
            await MessageUtils.send(channel, testingEmbed);
            return;
        }
    }
}
