import {
    ApplicationCommandOptionType,
    RESTPostAPIChatInputApplicationCommandsJSONBody,
} from 'discord-api-types/v10';
import {
    CommandInteraction,
    GuildMember,
    MessageEmbed,
    MessageOptions,
    Permissions,
    PermissionString,
    Role,
    TextChannel,
} from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';
import moment from 'moment';
import { createRequire } from 'node:module';

import { CustomMessage, MemberAnniversaryRole, UserData } from '../models/database/index.js';
import { EventData } from '../models/index.js';
import { BlacklistRepo } from '../services/database/repos/blacklist-repo.js';
import { CustomMessageRepo } from '../services/database/repos/custom-message-repo.js';
import { MemberAnniversaryRoleRepo } from '../services/database/repos/member-anniversary-role-repo.js';
import { TrustedRoleRepo } from '../services/database/repos/trusted-role-repo.js';
import { UserRepo } from '../services/database/repos/user-repo.js';
import { Lang } from '../services/index.js';
import {
    ActionUtils,
    CelebrationUtils,
    InteractionUtils,
    MessageUtils,
    PermissionUtils,
} from '../utils/index.js';
import { Command, CommandDeferType } from './index.js';

const require = createRequire(import.meta.url);
let Config = require('../../config/config.json');
export class TestCommand implements Command {
    public metadata: RESTPostAPIChatInputApplicationCommandsJSONBody = {
        name: Lang.getCom('commands.test'),
        description: 'View the next event date. Defaults to birthday.',
        dm_permission: false,
        default_member_permissions: Permissions.resolve([
            Permissions.FLAGS.ADMINISTRATOR,
        ]).toString(),
        options: [
            {
                name: Lang.getCom('arguments.type'),
                description: 'What type of event to test.',
                type: ApplicationCommandOptionType.String.valueOf(),
                required: false,
                choices: [
                    {
                        name: 'birthday',
                        value: 'birthday',
                    },
                    {
                        name: 'memberAnniversary',
                        value: 'member_anniversary',
                    },
                    {
                        name: 'serverAnniversary',
                        value: 'server_anniversary',
                    },
                ],
            },
            {
                name: Lang.getCom('arguments.user'),
                description: 'Optional user argument to test the event on.',
                type: ApplicationCommandOptionType.User.valueOf(),
                required: false,
            },
            {
                name: Lang.getCom('arguments.year'),
                description:
                    'Optional year argument to test the event on. Member Anniversaries only',
                type: ApplicationCommandOptionType.Integer.valueOf(),
                required: false,
                min_value: 1,
                max_value: 100,
            },
        ],
    };
    public cooldown = new RateLimiter(1, 5000);
    public deferType = CommandDeferType.PUBLIC;
    public requireClientPerms: PermissionString[] = [];
    public requireSetup = true;
    public requireVote = false;
    public requirePremium = false;

    constructor(
        public userRepo: UserRepo,
        public blacklistRepo: BlacklistRepo,
        public trustedRoleRepo: TrustedRoleRepo,
        public customMessageRepo: CustomMessageRepo,
        public memberAnniversaryRoleRepo: MemberAnniversaryRoleRepo
    ) {}

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        let type = intr.options.getString(Lang.getCom('arguments.type')) ?? 'birthday';
        let user = intr.options.getUser(Lang.getCom('arguments.user'));
        let year = intr.options.getInteger(Lang.getCom('arguments.year'));

        // bday test <type> [user] [year]
        let guild = intr.guild;

        let target: GuildMember = guild.members.resolve(user);
        let userData: UserData;

        // If we have a target get their data otherwise use the client
        if (!target) target = guild.members.resolve(intr.client.user);
        else if (!target.user.bot) userData = await this.userRepo.getUser(target.id);

        let guildData = data.guild;

        let messageChannel: TextChannel;

        try {
            messageChannel = guild.channels.resolve(
                type === 'birthday'
                    ? guildData.BirthdayChannelDiscordId
                    : type === 'member_anniversary'
                    ? guildData.MemberAnniversaryChannelDiscordId
                    : guildData.ServerAnniversaryChannelDiscordId
            ) as TextChannel;
        } catch (error) {
            // No birthday channel
        }

        let customMessages: CustomMessage[];
        let msgOptions: MessageOptions = {};
        let mentionString = CelebrationUtils.getMentionString(guildData, guild, type);
        let messageCheck = messageChannel && PermissionUtils.canSend(messageChannel);

        if (mentionString && mentionString !== '') msgOptions.content = mentionString;

        if (type === 'birthday') {
            // run the birthday test

            // If a check is true, it "passes" (we are trying to pass all checks)
            // example: blackListCheck false means the user was IN the blacklist
            let roleCheck = false;
            let trustedCheckMessage = false;
            let trustedCheckRole = false;
            let trustedPreventsMessage = guildData.TrustedPreventsMessage;
            let trustedPreventsRole = guildData.TrustedPreventsRole;
            let birthdayCheck = target.user.bot ? true : userData?.Birthday ? true : false;
            let blacklistCheck = false;

            let message = Lang.getRef('info', 'defaults.birthdayMessage', data.lang());
            let color = Config.colors.default;
            let useEmbed = true;

            // Get the blacklist data for this guild
            let blacklistData = await this.blacklistRepo.getBlacklist(guild.id);

            let blacklistIds = blacklistData.blacklist.map(data => data.DiscordId);

            blacklistCheck = !(
                blacklistIds.includes(target.id) ||
                [...target.roles.cache.keys()].find(r => blacklistIds.includes(r))
            );

            // Get the birthday role for this guild
            let birthdayRole: Role;
            try {
                birthdayRole = guild.roles.resolve(guildData.BirthdayRoleDiscordId);
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
                data.hasPremium
            );
            trustedCheckMessage = CelebrationUtils.passesTrustedCheck(
                guildData.RequireAllTrustedRoles,
                trustedRoleList,
                guildMember,
                trustedPreventsMessage,
                data.hasPremium
            );

            // Check for user specific messages
            if (target.user.bot) {
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
                            data.hasPremium,
                            'birthday'
                        );
                        // Find the color of the embed
                        color = CelebrationUtils.getMessageColor(customMessage, data.hasPremium);

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

                    // Send our message
                    if (useEmbed) {
                        msgOptions.embeds = [
                            new MessageEmbed().setDescription(message).setColor(color),
                        ];
                    } else {
                        if (msgOptions.content === undefined) msgOptions.content = message;
                        else msgOptions.content += `\n${message}`;
                    }

                    await MessageUtils.send(messageChannel, msgOptions);
                }
            }

            ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            // Give Test Result Message
            ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            let testingEmbed = Lang.getEmbed('results', 'test.birthday', data.lang(), {
                ICON: intr.client.user.displayAvatarURL(),
            })
                .addField(
                    Lang.getRef('info', 'terms.birthdayChannel', data.lang()),
                    messageCheck
                        ? `${Config.emotes.confirm} ${Lang.getRef(
                              'info',
                              'terms.correctlySet',
                              data.lang()
                          )}`
                        : `${Config.emotes.deny} ${Lang.getRef(
                              'info',
                              'terms.notSetOrIncorrect',
                              data.lang()
                          )}`,
                    true
                )
                .addField(
                    Lang.getRef('info', 'terms.birthdayRole', data.lang()),
                    roleCheck
                        ? `${Config.emotes.confirm} ${Lang.getRef(
                              'info',
                              'terms.correctlySet',
                              data.lang()
                          )}`
                        : `${Config.emotes.deny} ${Lang.getRef(
                              'info',
                              'terms.notSetOrIncorrect',
                              data.lang()
                          )}`,
                    true
                );

            if (!target.user.bot) {
                testingEmbed.addField(
                    Lang.getRef('info', 'terms.hasBirthdaySet', data.lang()),
                    birthdayCheck
                        ? `${Config.emotes.confirm} ${Lang.getRef(
                              'info',
                              'boolean.yes',
                              data.lang()
                          )}`
                        : `${Config.emotes.deny} ${Lang.getRef('info', 'boolean.no', data.lang())}`,
                    true
                );
            }

            if (blacklistData.blacklist.length > 0) {
                testingEmbed.addField(
                    Lang.getRef('info', 'terms.memberInBlacklist', data.lang()),
                    blacklistCheck
                        ? `${Config.emotes.confirm} ${Lang.getRef(
                              'info',
                              'terms.notInBlacklist',
                              data.lang()
                          )}`
                        : `${Config.emotes.deny} ${Lang.getRef(
                              'info',
                              'terms.inBlacklist',
                              data.lang()
                          )}`,
                    true
                );
            }

            if (trustedRoles.trustedRoles.length > 0) {
                testingEmbed.addField(
                    Lang.getRef('info', 'terms.trustedPreventMsg', data.lang()),
                    trustedCheckMessage
                        ? `${Config.emotes.confirm} ${Lang.getRef(
                              'info',
                              'terms.didntPreventMsg',
                              data.lang()
                          )}`
                        : `${Config.emotes.deny} ${Lang.getRef(
                              'info',
                              'terms.didPreventMsg',
                              data.lang()
                          )}`,
                    true
                );
                testingEmbed.addField(
                    Lang.getRef('info', 'terms.trustedPreventRole', data.lang()),
                    trustedCheckRole
                        ? `${Config.emotes.confirm} ${Lang.getRef(
                              'info',
                              'terms.didntPreventRole',
                              data.lang()
                          )}`
                        : `${Config.emotes.deny} ${Lang.getRef(
                              'info',
                              'terms.didPreventRole',
                              data.lang()
                          )}`,
                    true
                );
            }
            await InteractionUtils.send(intr, testingEmbed);
            return;
        } else if (type === 'member_anniversary') {
            // run the member anniversary test

            // If a check is true, it "passes" (we are trying to pass all checks)
            // example: blackListCheck false means the user was IN the blacklist
            let memberAnniversaryRolesCheck = false;
            let memberAnniversaryRoles: MemberAnniversaryRole[];
            let anniversaryResolvedRoles: Role[];

            let message = Lang.getRef('info', 'defaults.memberAnniversaryMessage', data.lang());
            let color = Config.colors.default;
            let useEmbed = true;
            let guildMember = guild.members.resolve(target);

            let timezoneCheck = guildData?.DefaultTimezone !== '0';

            // calculate the year if it wasn't given
            if (!year && timezoneCheck) {
                // plus one since we are celebrating the NEXT anniversary in the test
                let currentDate = moment().tz(guildData.DefaultTimezone);
                let memberAnniversary = moment(target.joinedAt);

                year = currentDate.year() - memberAnniversary.year();

                // if the anniversary already happened this year, we need to add one to the year
                if (currentDate.format('MM-DD') > memberAnniversary.format('MM-DD')) {
                    year++;
                }
            }

            // Only premium guilds get anniversary roles
            if (data.hasPremium) {
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
                memberAnniversaryRolesCheck = CelebrationUtils.canGiveAllRoles(
                    guild,
                    anniversaryResolvedRoles,
                    guildMember
                );
            }

            // Check for user specific messages
            if (target.user.bot) {
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
            if (messageCheck && timezoneCheck) {
                let userList = CelebrationUtils.getUserListString(guildData, [guildMember]);

                if (customMessages.length > 0) {
                    // Get our custom message
                    let customMessage = CelebrationUtils.randomMessage(
                        customMessages,
                        data.hasPremium,
                        'memberanniversary'
                    );
                    // Find the color of the embed
                    color = CelebrationUtils.getMessageColor(customMessage, data.hasPremium);
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

                // Send our message

                if (useEmbed) {
                    msgOptions.embeds = [
                        new MessageEmbed().setDescription(message).setColor(color),
                    ];
                } else {
                    if (msgOptions.content === undefined) msgOptions.content = message;
                    else msgOptions.content += `\n${message}`;
                }

                await MessageUtils.send(messageChannel, msgOptions);
            }

            ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            // Give Test Result Message
            ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            let testingEmbed = Lang.getEmbed('results', 'test.memberAnniversary', data.lang(), {
                ICON: intr.client.user.displayAvatarURL(),
            })
                .addField(
                    Lang.getRef('info', 'terms.defaultTimezone', data.lang()),
                    timezoneCheck
                        ? `${Config.emotes.confirm} ${Lang.getRef(
                              'info',
                              'terms.correctlySet',
                              data.lang()
                          )}`
                        : `${Config.emotes.deny} ${Lang.getRef(
                              'info',
                              'terms.notSet',
                              data.lang()
                          )}`,
                    true
                )
                .addField(
                    Lang.getRef('info', 'terms.memberAnniversaryChannel', data.lang()),
                    messageCheck
                        ? `${Config.emotes.confirm} ${Lang.getRef(
                              'info',
                              'terms.correctlySet',
                              data.lang()
                          )}`
                        : `${Config.emotes.deny} ${Lang.getRef(
                              'info',
                              'terms.notSetOrIncorrect',
                              data.lang()
                          )}`,
                    true
                );

            if (data.hasPremium && memberAnniversaryRoles.length > 0) {
                testingEmbed.addField(
                    Lang.getRef('info', 'terms.memberAnniversaryRoles', data.lang()),
                    memberAnniversaryRolesCheck
                        ? `${Config.emotes.confirm} ${Lang.getRef(
                              'info',
                              'terms.canBeGiven',
                              data.lang()
                          )}`
                        : `${Config.emotes.deny} ${Lang.getRef(
                              'info',
                              'terms.cantBeGivenPermIssue',
                              data.lang()
                          )}`,
                    true
                );
            }
            await InteractionUtils.send(intr, testingEmbed);
            return;
        } else {
            // run the server anniversary test

            // If a check is true, it "passes" (we are trying to pass all checks)
            // example: blackListCheck false means the user was IN the blacklist

            let message = Lang.getRef('info', 'defaults.serverAnniversaryMessage', data.lang());
            let color = Config.colors.default;
            let useEmbed = true;

            let timezoneCheck = guildData?.DefaultTimezone !== '0';

            // calculate the year if it wasn't given

            // calculate the year if it wasn't given
            if (!year && timezoneCheck) {
                // plus one since we are celebrating the NEXT anniversary in the test
                let currentDate = moment().tz(guildData.DefaultTimezone);
                let serverAnniversary = moment(guild.createdAt);

                year = currentDate.year() - serverAnniversary.year();

                // if the anniversary already happened this year, we need to add one to the year
                if (currentDate.format('MM-DD') > serverAnniversary.format('MM-DD')) {
                    year++;
                }
            }

            customMessages = (
                await this.customMessageRepo.getCustomMessages(guild.id, 'serveranniversary')
            ).customMessages;

            if (messageCheck && timezoneCheck) {
                if (customMessages.length > 0) {
                    // Get our custom message
                    let customMessage = CelebrationUtils.randomMessage(
                        customMessages,
                        data.hasPremium,
                        'serveranniversary'
                    );
                    // Find the color of the embed
                    color = CelebrationUtils.getMessageColor(customMessage, data.hasPremium);
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

                // Send our message

                if (useEmbed) {
                    msgOptions.embeds = [
                        new MessageEmbed().setDescription(message).setColor(color),
                    ];
                } else {
                    if (msgOptions.content === undefined) msgOptions.content = message;
                    else msgOptions.content += `\n${message}`;
                }

                await MessageUtils.send(messageChannel, msgOptions);
            }

            ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            // Give Test Result Message
            ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            let testingEmbed = Lang.getEmbed('results', 'test.serverAnniversary', data.lang(), {
                ICON: intr.client.user.displayAvatarURL(),
            })
                .addField(
                    Lang.getRef('info', 'terms.defaultTimezone', data.lang()),
                    timezoneCheck
                        ? `${Config.emotes.confirm} ${Lang.getRef(
                              'info',
                              'terms.correctlySet',
                              data.lang()
                          )}`
                        : `${Config.emotes.deny} ${Lang.getRef(
                              'info',
                              'terms.notSet',
                              data.lang()
                          )}`,
                    true
                )
                .addField(
                    Lang.getRef('info', 'terms.serverAnniversaryChannel', data.lang()),
                    messageCheck
                        ? `${Config.emotes.confirm} ${Lang.getRef(
                              'info',
                              'terms.correctlySet',
                              data.lang()
                          )}`
                        : `${Config.emotes.deny} ${Lang.getRef(
                              'info',
                              'terms.notSetOrIncorrect',
                              data.lang()
                          )}`,
                    true
                );
            await InteractionUtils.send(intr, testingEmbed);
            return;
        }
    }
}
