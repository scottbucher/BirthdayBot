import {
    BaseGuildTextChannel,
    Message,
    MessageReaction,
    TextBasedChannels,
    TextChannel,
    User,
} from 'discord.js';
import {
    CollectOptions,
    CollectorUtils,
    ExpireFunction,
    MessageFilter,
} from 'discord.js-collector-utils';
import { GuildUtils, MessageUtils, PermissionUtils } from '../../utils';

import { GuildRepo } from '../../services/database/repos';
import { Lang } from '../../services';
import { LangCode } from '../../models/enums';

let Config = require('../../../config/config.json');

const COLLECT_OPTIONS: CollectOptions = {
    time: Config.experience.promptExpireTime * 1000,
    reset: true,
};

export class SetupAnniversary {
    constructor(private guildRepo: GuildRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel): Promise<void> {
        let guild = channel.guild;
        // let botUser = guild.client.user;
        let stopFilter: MessageFilter = (nextMsg: Message) =>
            nextMsg.author.id === msg.author.id &&
            [Config.prefix, ...Config.stopCommands].includes(
                nextMsg.content.split(/\s+/)[0].toLowerCase()
            );
        let expireFunction: ExpireFunction = async () => {
            await MessageUtils.reply(msg, Lang.getEmbed('results.promptExpired', LangCode.EN_US));
        };

        let memberAnniversaryChannel: string;
        let serverAnniversaryChannel: string;

        // Member Anniversary Channel Setup

        let memberAnniversaryChannelEmbed = Lang.getEmbed(
            'serverPrompts.anniversarySetupMemberChannel',
            LangCode.EN_US,
            {
                ICON: msg.client.user.displayAvatarURL(),
            }
        );

        let reactOptions = [Config.emotes.create, Config.emotes.select, Config.emotes.deny];

        let memberAnniversaryChannelMessage = await MessageUtils.send(
            channel,
            memberAnniversaryChannelEmbed
        );
        for (let reactOption of reactOptions) {
            await MessageUtils.react(memberAnniversaryChannelMessage, reactOption);
        }

        let memberAnniversaryChannelOption: string = await CollectorUtils.collectByReaction(
            memberAnniversaryChannelMessage,
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

        await MessageUtils.delete(memberAnniversaryChannelMessage);

        if (memberAnniversaryChannelOption === undefined) return;

        switch (memberAnniversaryChannelOption) {
            case Config.emotes.create: {
                // Create channel with desired attributes
                memberAnniversaryChannel = (
                    await guild.channels.create(
                        Lang.getRef('defaults.memberAnniversaryChannelName', LangCode.EN_US),
                        {
                            type: 'GUILD_TEXT',
                            topic: Lang.getRef(
                                'defaults.memberAnniversaryChannelTopic',
                                LangCode.EN_US
                            ),
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

                memberAnniversaryChannel = await CollectorUtils.collectByMessage(
                    msg.channel,
                    // Collect Filter
                    (nextMsg: Message) => nextMsg.author.id === msg.author.id,
                    stopFilter,
                    // Retrieve Result
                    async (nextMsg: Message) => {
                        // Find mentioned channel
                        let channelInput: BaseGuildTextChannel =
                            GuildUtils.getMentionedTextChannel(nextMsg);

                        if (!channelInput) {
                            MessageUtils.send(
                                channel,
                                Lang.getEmbed('validation.invalidChannel', LangCode.EN_US)
                            );
                            return;
                        }

                        // Bot needs to be able to message in the desired channel
                        if (!PermissionUtils.canSend(channelInput)) {
                            MessageUtils.send(
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

                if (memberAnniversaryChannel === undefined) {
                    return;
                }
                break;
            }
            case Config.emotes.deny: {
                memberAnniversaryChannel = '0';
                break;
            }
        }

        // Sever Anniversary Channel Setup

        let serverAnniversaryChannelEmbed = Lang.getEmbed(
            'serverPrompts.anniversarySetupServerChannel',
            LangCode.EN_US,
            {
                ICON: msg.client.user.displayAvatarURL(),
            }
        );

        let serverAnniversaryChannelMessage = await MessageUtils.send(
            channel,
            serverAnniversaryChannelEmbed
        );
        for (let reactOption of reactOptions) {
            await MessageUtils.react(serverAnniversaryChannelMessage, reactOption);
        }

        let serverAnniversaryChannelOption: string = await CollectorUtils.collectByReaction(
            serverAnniversaryChannelMessage,
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

        await MessageUtils.delete(serverAnniversaryChannelMessage);

        if (serverAnniversaryChannelOption === undefined) return;

        switch (serverAnniversaryChannelOption) {
            case Config.emotes.create: {
                // Create channel with desired attributes
                serverAnniversaryChannel = (
                    await guild.channels.create(
                        Lang.getRef('defaults.serverAnniversaryChannelName', LangCode.EN_US),
                        {
                            type: 'GUILD_TEXT',
                            topic: Lang.getRef(
                                'defaults.serverAnniversaryChannelTopic',
                                LangCode.EN_US
                            ),
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

                serverAnniversaryChannel = await CollectorUtils.collectByMessage(
                    msg.channel,
                    // Collect Filter
                    (nextMsg: Message) => nextMsg.author.id === msg.author.id,
                    stopFilter,
                    // Retrieve Result
                    async (nextMsg: Message) => {
                        // Find mentioned channel
                        let channelInput: BaseGuildTextChannel =
                            GuildUtils.getMentionedTextChannel(nextMsg);

                        if (!channelInput) {
                            MessageUtils.send(
                                channel,
                                Lang.getEmbed('validation.invalidChannel', LangCode.EN_US)
                            );
                            return;
                        }

                        // Bot needs to be able to message in the desired channel
                        if (!PermissionUtils.canSend(channelInput)) {
                            MessageUtils.send(
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

                if (serverAnniversaryChannel === undefined) {
                    return;
                }
                break;
            }
            case Config.emotes.deny: {
                serverAnniversaryChannel = '0';
                break;
            }
        }

        // Output

        let memberAnniversaryChannelOutput =
            memberAnniversaryChannel === '0'
                ? `${Lang.getRef('terms.notSet', LangCode.EN_US)}`
                : guild.channels.resolve(memberAnniversaryChannel)?.toString() ||
                  `**${Lang.getRef('terms.unknownChannel', LangCode.EN_US)}**`;
        let serverAnniversaryChannelOutput =
            serverAnniversaryChannel === '0'
                ? `${Lang.getRef('terms.notSet', LangCode.EN_US)}`
                : guild.channels.resolve(serverAnniversaryChannel)?.toString() ||
                  `**${Lang.getRef('terms.unknownChannel', LangCode.EN_US)}**`;

        await MessageUtils.send(
            channel,
            Lang.getEmbed('results.anniversarySetup', LangCode.EN_US, {
                MEMBER_CHANNEL: memberAnniversaryChannelOutput,
                SERVER_CHANNEL: serverAnniversaryChannelOutput,
                ICON: msg.client.user.displayAvatarURL(),
            })
        );

        await this.guildRepo.guildSetupAnniversary(
            guild.id,
            memberAnniversaryChannel,
            serverAnniversaryChannel
        );
    }
}
