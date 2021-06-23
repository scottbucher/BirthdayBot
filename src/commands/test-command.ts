import {
    ActionUtils,
    CelebrationUtils,
    ColorUtils,
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
import { CustomMessage, CustomMessages, UserData } from '../models/database';
import {
    MemberAnniversaryRole,
    MemberAnniversaryRoles,
} from '../models/database/member-anniversary-role-models';
import { Message, MessageEmbed, Role, TextChannel, User } from 'discord.js';

import { Command } from './command';
import { Lang } from '../services';
import { LangCode } from '../models/enums';
import { isNumber } from 'class-validator';
import moment from 'moment';

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
        private customMessageReop: CustomMessageRepo,
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
        //bday test <type> [user] [year]
        let guild = msg.guild;

        if (args.length < 3) {
            MessageUtils.send(
                channel,
                Lang.getEmbed('validation.invalidCelebrationType', LangCode.EN_US)
            );
            return;
        }

        let type = FormatUtils.extractCelebrationType(args[2].toLowerCase());

        if (!type) {
            MessageUtils.send(
                channel,
                Lang.getEmbed('validation.invalidCelebrationType', LangCode.EN_US)
            );
            return;
        }

        let target: User;
        let year: number;
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
        } else {
            // They didn't mention anyone
            target = msg.client.user;
        }

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

        let channelCheck: boolean = messageChannel && PermissionUtils.canSend(messageChannel);

        let customMessages: CustomMessage[];
        let mentionString = await CelebrationUtils.getMentionString(guildData, guild, type);

        if (type === 'birthday') {
            // run the birthday test

            // If a check is true, it "passes" (we are trying to pass all checks)
            // example: blackListCheck false means the user was IN the blacklist
            let roleCheck = false;
            let messageCheck = false;
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
                birthdayRole = guild.roles.resolve(guildData.BirthdayMasterRoleDiscordId) as Role;
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
                    await this.customMessageReop.getCustomUserMessages(guild.id, 'birthday')
                ).customMessages.filter(message => message.UserDiscordId === target.id);
            }

            // if we never looked for them or there were none to match this user then lets get regular custom birthday messages
            if (!customMessages || customMessages.length === 0)
                customMessages = (
                    await this.customMessageReop.getCustomMessages(guild.id, 'birthday')
                ).customMessages;

            messageCheck = customMessages.length > 0;

            if (blacklistCheck && birthdayCheck) {
                if (roleCheck && trustedCheckRole) {
                    await ActionUtils.giveRole(guildMember, birthdayRole);
                }

                if (messageCheck && trustedCheckRole) {
                    // Get our custom message
                    let customMessage = CelebrationUtils.randomMessage(customMessages, hasPremium);

                    let userList = CelebrationUtils.getUserListString(guildData, [guildMember]);

                    // Replace the placeholders
                    message = CelebrationUtils.replacePlaceHolders(
                        message,
                        guild,
                        type,
                        userList,
                        null
                    );

                    // Find the color of the embed
                    color = customMessage?.Color === '0' ? Config.colors.default : null;

                    color = !color
                        ? '#' + ColorUtils.findHex(customMessage?.Color) ?? Config.colors.default
                        : Config.colors.default;
                    useEmbed = customMessage.Embed ? true : false;

                    // Send our message(s)
                    if (mentionString !== '')
                        await MessageUtils.send(messageChannel, mentionString);

                    let embed = new MessageEmbed().setDescription(message).setColor(color);
                    await MessageUtils.send(messageChannel, useEmbed ? embed : message);
                }
            }

            ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            // Give Test Result Message
            ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            let testingEmbed = new MessageEmbed()
                .setThumbnail(guild.iconURL())
                .setTitle('Birthday Event Test - [BETA]')
                .setDescription(
                    'Below are the checks to ensure your settings are correct for the birthday event.'
                )
                .setFooter(
                    'This is the info from your birthday event test.',
                    guild.client.user.avatarURL()
                )
                .setTimestamp()
                .setColor(Config.colors.default)
                .addField(
                    'Birthday Channel',
                    messageCheck
                        ? `${Config.emotes.confirm} Correctly set.`
                        : `${Config.emotes.deny} Not Set (or Incorrectly Set).`,
                    true
                )
                .addField(
                    'Birthday Role',
                    roleCheck
                        ? `${Config.emotes.confirm} Correctly set.`
                        : `${Config.emotes.deny} Not Set (or Incorrectly Set).`,
                    true
                );

            if (blacklistData.blacklist.length > 0) {
                testingEmbed.addField(
                    'Member In Birthday Blacklist',
                    trustedCheckMessage
                        ? `${Config.emotes.confirm} Not in blacklist.`
                        : `${Config.emotes.deny} In blacklist.`,
                    true
                );
            }

            if (trustedRoles.trustedRoles.length > 0) {
                testingEmbed.addField(
                    'Trusted Prevented Message',
                    trustedCheckMessage
                        ? `${Config.emotes.confirm} Didn't Prevent Message.`
                        : `${Config.emotes.deny} Prevented Message.`,
                    true
                );
                testingEmbed.addField(
                    'Trusted Prevented Role',
                    trustedCheckRole
                        ? `${Config.emotes.confirm} Didn't Prevent Role.`
                        : `${Config.emotes.deny} Prevented Role.`,
                    true
                );
            }
            await MessageUtils.send(channel, testingEmbed);
            return;
        } else if (type === 'memberanniversary') {
            // run the member anniversary test

            // If a check is true, it "passes" (we are trying to pass all checks)
            // example: blackListCheck false means the user was IN the blacklist
            let messageCheck = false;
            let memberAnniversaryRolesCheck = false;
            let memberAnniversaryRoles: MemberAnniversaryRole[];
            let anniversaryResolvedRoles: Role[];

            let message = Lang.getRef('defaults.memberAnniversaryMessage', LangCode.EN_US);
            let color = Config.colors.default;
            let useEmbed = true;
            let giveRole: Role;
            let guildMember = guild.members.resolve(target);

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
                    await this.customMessageReop.getCustomUserMessages(
                        guild.id,
                        'memberanniversary'
                    )
                ).customMessages.filter(message => message.UserDiscordId === target.id);
            }

            // if we never looked for them or there were none to match this user then lets get regular custom birthday messages
            if (!customMessages || customMessages.length === 0)
                customMessages = (
                    await this.customMessageReop.getCustomMessages(guild.id, 'memberanniversary')
                ).customMessages;

            messageCheck = customMessages.length > 0;

            for (let role of anniversaryResolvedRoles) {
                let roleData = memberAnniversaryRoles.find(
                    data => data.MemberAnniversaryRoleDiscordId === role.id
                );

                if (roleData.Year === year) {
                    await ActionUtils.giveRole(guildMember, role);
                }
            }
            if (messageCheck) {
                // Get our custom message
                let customMessage = CelebrationUtils.randomMessage(customMessages, hasPremium);

                let userList = CelebrationUtils.getUserListString(guildData, [guildMember]);

                // Replace the placeholders
                message = CelebrationUtils.replacePlaceHolders(
                    message,
                    guild,
                    type,
                    userList,
                    year === 0 ? 1 : year
                );

                // Find the color of the embed
                color = customMessage?.Color === '0' ? Config.colors.default : null;

                color = !color
                    ? '#' + ColorUtils.findHex(customMessage?.Color) ?? Config.colors.default
                    : Config.colors.default;
                useEmbed = customMessage.Embed ? true : false;

                // Send our message(s)
                if (mentionString !== '') await MessageUtils.send(messageChannel, mentionString);

                let embed = new MessageEmbed().setDescription(message).setColor(color);
                await MessageUtils.send(messageChannel, useEmbed ? embed : message);
            }

            ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            // Give Test Result Message
            ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            let testingEmbed = new MessageEmbed()
                .setThumbnail(guild.iconURL())
                .setTitle('Member Anniversary Event Test - [BETA]')
                .setDescription(
                    'Below are the checks to ensure your settings are correct for the member anniversary event.'
                )
                .setFooter(
                    'This is the info from your latest member anniversary event test.',
                    guild.client.user.avatarURL()
                )
                .setTimestamp()
                .setColor(Config.colors.default)
                .addField(
                    'Member Anniversary Channel',
                    messageCheck
                        ? `${Config.emotes.confirm} Correctly set.`
                        : `${Config.emotes.deny} Not Set (or Incorrectly Set).`,
                    true
                );

            if (hasPremium && memberAnniversaryRoles.length > 0) {
                testingEmbed.addField(
                    'Member Anniversary Roles',
                    memberAnniversaryRolesCheck
                        ? `${Config.emotes.confirm} Can be given.`
                        : `${Config.emotes.deny} Cannot be given. (Permission Issue)`,
                    true
                );
            }
            await MessageUtils.send(channel, testingEmbed);
            return;
        } else {
            // run the server anniversary test

            // If a check is true, it "passes" (we are trying to pass all checks)
            // example: blackListCheck false means the user was IN the blacklist
            let messageCheck = false;

            let message = Lang.getRef('defaults.serverAnniversaryMessage', LangCode.EN_US);
            let color = Config.colors.default;
            let useEmbed = true;

            customMessages = (
                await this.customMessageReop.getCustomMessages(guild.id, 'serveranniversary')
            ).customMessages;

            messageCheck = customMessages.length > 0;

            if (messageCheck) {
                // Get our custom message
                let customMessage = CelebrationUtils.randomMessage(customMessages, hasPremium);

                // Replace the placeholders
                message = CelebrationUtils.replacePlaceHolders(
                    message,
                    guild,
                    type,
                    target.toString(),
                    year === 0 ? 1 : year
                );

                // Find the color of the embed
                color = customMessage?.Color === '0' ? Config.colors.default : null;

                color = !color
                    ? '#' + ColorUtils.findHex(customMessage?.Color) ?? Config.colors.default
                    : Config.colors.default;
                useEmbed = customMessage.Embed ? true : false;

                // Send our message(s)
                if (mentionString !== '') await MessageUtils.send(messageChannel, mentionString);

                let embed = new MessageEmbed().setDescription(message).setColor(color);
                await MessageUtils.send(messageChannel, useEmbed ? embed : message);
            }

            ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            // Give Test Result Message
            ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            let testingEmbed = new MessageEmbed()
                .setThumbnail(guild.iconURL())
                .setTitle('Server Anniversary Event Test - [BETA]')
                .setDescription(
                    'Below are the checks to ensure your settings are correct for the server anniversary event.'
                )
                .setFooter(
                    'This is the info from your latest server anniversary event test.',
                    guild.client.user.avatarURL()
                )
                .setTimestamp()
                .setColor(Config.colors.default)
                .addField(
                    'Server Anniversary Channel',
                    messageCheck
                        ? `${Config.emotes.confirm} Correctly set.`
                        : `${Config.emotes.deny} Not Set (or Incorrectly Set).`,
                    true
                );
            await MessageUtils.send(channel, testingEmbed);
            return;
        }
    }
}
