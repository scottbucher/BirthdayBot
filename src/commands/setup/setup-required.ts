import {
    CollectOptions,
    CollectorUtils,
    ExpireFunction,
    MessageFilter,
} from 'discord.js-collector-utils';
import { Message, MessageReaction, Role, TextChannel, User } from 'discord.js';
import { MessageUtils, PermissionUtils } from '../../utils';

import { GuildRepo } from '../../services/database/repos';
import { Lang } from '../../services';
import { LangCode } from '../../models/enums';

let Config = require('../../../config/config.json');

const COLLECT_OPTIONS: CollectOptions = {
    time: Config.experience.promptExpireTime * 1000,
    reset: true,
};

export class SetupRequired {
    constructor(private guildRepo: GuildRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel): Promise<void> {
        let guild = channel.guild;
        let botUser = guild.client.user;
        let stopFilter: MessageFilter = (nextMsg: Message) =>
            nextMsg.author.id === msg.author.id &&
            [Config.prefix, ...Config.stopCommands].includes(
                nextMsg.content.split(/\s+/)[0].toLowerCase()
            );
        let expireFunction: ExpireFunction = async () => {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('results.requireSetupExpired', LangCode.EN_US)
            );
        };

        let birthdayChannel: string;
        let birthdayRole: string;

        let channelEmbed = Lang.getEmbed(
            'serverPrompts.requiredSetupBirthdayChannel',
            LangCode.EN_US
        ).setAuthor(`${guild.name}`, guild.iconURL());
        let reactOptions = [Config.emotes.create, Config.emotes.select, Config.emotes.deny];

        let channelMessage = await MessageUtils.send(channel, channelEmbed);
        for (let reactOption of reactOptions) {
            await MessageUtils.react(channelMessage, reactOption);
        }

        let channelOption: string = await CollectorUtils.collectByReaction(
            channelMessage,
            // Collect Filter
            (msgReaction: MessageReaction, reactor: User) =>
                reactor.id === msg.author.id && reactOptions.includes(msgReaction.emoji.name),
            stopFilter,
            // Retrieve Result
            async (msgReaction: MessageReaction, reactor: User) => {
                return msgReaction.emoji.name;
            },
            expireFunction,
            COLLECT_OPTIONS
        );

        MessageUtils.delete(channelMessage);

        if (channelOption === undefined) return;

        switch (channelOption) {
            case Config.emotes.create: {
                // Create channel with desired attributes
                birthdayChannel = (
                    await guild.channels.create(
                        Lang.getRef('defaults.birthdayChannelName', LangCode.EN_US),
                        {
                            type: 'text',
                            topic: Lang.getRef('defaults.birthdayChannelTopic', LangCode.EN_US),
                            permissionOverwrites: [
                                {
                                    id: guild.id,
                                    deny: ['SEND_MESSAGES'],
                                    allow: ['VIEW_CHANNEL'],
                                },
                                {
                                    id: guild.me.roles.cache.filter(role => role.managed).first(),
                                    allow: [
                                        'VIEW_CHANNEL',
                                        'SEND_MESSAGES',
                                        'EMBED_LINKS',
                                        'ADD_REACTIONS',
                                        'READ_MESSAGE_HISTORY',
                                    ],
                                },
                            ],
                        }
                    )
                )?.id;
                break;
            }
            case Config.emotes.select: {
                let selectMessage = await MessageUtils.send(
                    channel,
                    Lang.getEmbed('serverPrompts.inputChannel', LangCode.EN_US)
                );

                birthdayChannel = await CollectorUtils.collectByMessage(
                    msg.channel,
                    // Collect Filter
                    (nextMsg: Message) => nextMsg.author.id === msg.author.id,
                    stopFilter,
                    // Retrieve Result
                    async (nextMsg: Message) => {
                        // Find mentioned channel
                        let channelInput: TextChannel = nextMsg.mentions.channels.first();

                        if (!channelInput) {
                            channelInput = guild.channels.cache
                                .filter(channel => channel instanceof TextChannel)
                                .map(channel => channel as TextChannel)
                                .find(channel =>
                                    channel.name
                                        .toLowerCase()
                                        .includes(nextMsg.content.toLowerCase())
                                );
                        }

                        if (!channelInput) {
                            await MessageUtils.send(
                                channel,
                                Lang.getEmbed('validation.invalidChannel', LangCode.EN_US)
                            );
                            return;
                        }

                        // Bot needs to be able to message in the desired channel
                        if (!PermissionUtils.canSend(channelInput)) {
                            await MessageUtils.send(
                                channel,
                                Lang.getEmbed('validation.noAccessToChannel', LangCode.EN_US, {
                                    CHANNEL: channelInput.toString(),
                                })
                            );
                            return;
                        }
                        return channelInput?.id;
                    },
                    expireFunction,
                    COLLECT_OPTIONS
                );

                MessageUtils.delete(selectMessage);

                if (birthdayChannel === undefined) {
                    return;
                }
                break;
            }
            case Config.emotes.deny: {
                birthdayChannel = '0';
                break;
            }
        }

        let roleEmbed = Lang.getEmbed(
            'serverPrompts.requiredSetupBirthdayRole',
            LangCode.EN_US
        ).setAuthor(`${guild.name}`, guild.iconURL());

        let roleMessage = await MessageUtils.send(channel, roleEmbed);
        for (let reactOption of reactOptions) {
            await MessageUtils.react(roleMessage, reactOption);
        }

        let roleOptions: string = await CollectorUtils.collectByReaction(
            roleMessage,
            // Collect Filter
            (msgReaction: MessageReaction, reactor: User) =>
                reactor.id === msg.author.id && reactOptions.includes(msgReaction.emoji.name),
            stopFilter,
            // Retrieve Result
            async (msgReaction: MessageReaction, reactor: User) => {
                return msgReaction.emoji.name;
            },
            expireFunction,
            COLLECT_OPTIONS
        );

        MessageUtils.delete(roleMessage);

        if (roleOptions === undefined) return;

        switch (roleOptions) {
            case Config.emotes.create: {
                // Create role with desired attributes
                birthdayRole = (
                    await guild.roles.create({
                        data: {
                            name: Config.emotes.birthday,
                            color: Config.colors.role,
                            hoist: true,
                            mentionable: true,
                        },
                    })
                )?.id;
                break;
            }
            case Config.emotes.select: {
                let selectMessage = await MessageUtils.send(
                    channel,
                    Lang.getEmbed('serverPrompts.inputRole', LangCode.EN_US)
                );

                birthdayRole = await CollectorUtils.collectByMessage(
                    msg.channel,
                    // Collect Filter
                    (nextMsg: Message) => nextMsg.author.id === msg.author.id,
                    // Stop Filter
                    stopFilter,
                    // Retrieve Result
                    async (nextMsg: Message) => {
                        // Find mentioned role
                        let roleInput: Role = nextMsg.mentions.roles.first();

                        // Search guild for role
                        if (!roleInput) {
                            roleInput = guild.roles.cache.find(role =>
                                role.name.toLowerCase().includes(nextMsg?.content.toLowerCase())
                            );
                        }

                        // If it couldn't find the role, the role was in another guild, or the role the everyone role
                        if (
                            !roleInput ||
                            roleInput.id === guild.id ||
                            nextMsg?.content.toLowerCase() === 'everyone'
                        ) {
                            MessageUtils.send(
                                channel,
                                Lang.getEmbed('validation.invalidRole', LangCode.EN_US)
                            );
                            return;
                        }

                        // Check the role's position
                        if (
                            roleInput.position >
                            guild.members.resolve(botUser).roles.highest.position
                        ) {
                            await MessageUtils.send(
                                msg.channel as TextChannel,
                                Lang.getEmbed('validation.roleHierarchyError', LangCode.EN_US, {
                                    BOT: msg.client.user.toString(),
                                })
                            );
                            return;
                        }

                        // Check if the role is managed
                        if (roleInput.managed) {
                            MessageUtils.send(
                                channel,
                                Lang.getEmbed('validation.birthdayRoleManaged', LangCode.EN_US)
                            );
                            return;
                        }

                        let membersWithRole = roleInput.members.size;

                        if (membersWithRole > 0 && membersWithRole < 100) {
                            await MessageUtils.send(
                                channel,
                                Lang.getEmbed(
                                    'validation.birthdayRoleUsedWarning',
                                    LangCode.EN_US,
                                    {
                                        AMOUNT: membersWithRole.toString(),
                                        S_Value: membersWithRole > 1 ? 's' : '',
                                    }
                                )
                            );
                        } else if (membersWithRole > 100) {
                            await MessageUtils.send(
                                channel,
                                Lang.getEmbed('validation.birthdayRoleUsedError', LangCode.EN_US, {
                                    AMOUNT: membersWithRole.toString(),
                                })
                            );
                            return;
                        }

                        return roleInput?.id;
                    },
                    expireFunction,
                    COLLECT_OPTIONS
                );

                MessageUtils.delete(selectMessage);

                if (birthdayRole === undefined) {
                    return;
                }
                break;
            }
            case Config.emotes.deny: {
                birthdayRole = '0';
                break;
            }
        }

        let channelOutput =
            birthdayChannel === '0'
                ? `${Lang.getRef('terms.notSet', LangCode.EN_US)}`
                : guild.channels.resolve(birthdayChannel)?.toString() ||
                  `**${Lang.getRef('terms.unknownChannel', LangCode.EN_US)}**`;
        let roleOutput =
            birthdayRole === '0'
                ? `${Lang.getRef('terms.notSet', LangCode.EN_US)}`
                : guild.roles.resolve(birthdayRole)?.toString() ||
                  `**${Lang.getRef('terms.unknownRole', LangCode.EN_US)}**`;

        await MessageUtils.send(
            channel,
            Lang.getEmbed('results.requiredSetup', LangCode.EN_US, {
                CHANNEL: channelOutput,
                ROLE: roleOutput,
            })
        );

        await this.guildRepo.addOrUpdateGuild(guild.id, birthdayChannel, birthdayRole);
    }
}
