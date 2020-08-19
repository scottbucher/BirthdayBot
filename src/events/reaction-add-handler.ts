import { ActionUtils, FormatUtils, PermissionUtils } from '../utils';
import {
    CollectOptions,
    CollectorUtils,
    ExpireFunction,
    MessageFilter,
} from 'discord.js-collector-utils';
import {
    Collection,
    Guild,
    Message,
    MessageEmbed,
    MessageReaction,
    TextChannel,
    User,
} from 'discord.js';
import { CustomMessageRepo, UserRepo } from '../services/database/repos';

import { EventHandler } from '.';
import { ListUtils } from '../utils/list-utils';
import { Logger } from '../services';

let Logs = require('../../lang/logs.json');
let Config = require('../../config/config.json');

const COLLECT_OPTIONS: CollectOptions = {
    time: Config.promptExpireTime * 1000,
    reset: true,
};

export class ReactionAddHandler implements EventHandler {
    constructor(private userRepo: UserRepo, private customMessageRepo: CustomMessageRepo) {}

    public async process(msgReaction: MessageReaction, reactor: User): Promise<void> {
        // Don't respond to bots, and only text channels
        if (reactor.bot || !(msgReaction.message.channel instanceof TextChannel)) return;

        // Check permissions needed to respond
        let channel = msgReaction.message.channel as TextChannel;
        if (
            !PermissionUtils.canSend(channel) ||
            !PermissionUtils.canHandleReaction(channel) ||
            !PermissionUtils.canReact(channel)
        ) {
            return;
        }

        // Check if the reacted emoji is one we are handling
        if (
            ![
                Config.emotes.nextPage,
                Config.emotes.previousPage,
                Config.emotes.jumpToPage,
            ].includes(msgReaction.emoji.name)
        ) {
            return;
        }

        // Get the reacted message
        let msg: Message;
        if (msgReaction.message.partial) {
            try {
                msg = await msgReaction.message.fetch();
            } catch (error) {
                Logger.error(Logs.error.messagePartial, error);
                return;
            }
        } else {
            msg = msgReaction.message;
        }

        let users: Collection<string, User>;
        try {
            users = await msgReaction.users.fetch();
        } catch (error) {
            Logger.error(Logs.error.userFetch, error);``
            return;
        }

        // Check if the reacted message was sent by the bot
        if (msg.author !== msgReaction.message.client.user) {
            return;
        }

        // Check if bot has reacted to the message before
        if (!users.find(user => user === msg.client.user)) {
            return;
        }

        let checkNextPage: boolean = msgReaction.emoji.name === Config.emotes.nextPage;
        let checkPreviousPage: boolean = msgReaction.emoji.name === Config.emotes.previousPage;
        let checkJumpToPage: boolean = msgReaction.emoji.name === Config.emotes.jumpToPage;

        let stopFilter: MessageFilter = (nextMsg: Message) =>
            nextMsg.author.id === msg.author.id &&
            nextMsg.content.split(/\s+/)[0].toLowerCase() === Config.prefix;

        let expireFunction: ExpireFunction = async () => {
            return;
        };
        let titleArgs = msg.embeds[0]?.title?.split(/\s+/);

        if (!titleArgs) return;

        if (checkNextPage || checkPreviousPage) {
            if (titleArgs[1] === 'Messages') {
                let page = 1;

                if (titleArgs[4]) {
                    try {
                        if (checkNextPage) {
                            page = FormatUtils.extractPageNumber(titleArgs.join(' ')) + 1;
                        } else page = FormatUtils.extractPageNumber(titleArgs.join(' ')) - 1;
                    } catch (error) {
                        // Not A Number
                    }
                    if (!page) page = 1;
                }

                await ListUtils.updateMessageList(this.customMessageRepo, msg.guild, msg, page);
            } else if (titleArgs[1] === 'List') {
                let page = 1;

                if (titleArgs[4]) {
                    try {
                        if (checkNextPage) {
                            page = FormatUtils.extractPageNumber(titleArgs.join(' ')) + 1;
                        } else page = FormatUtils.extractPageNumber(titleArgs.join(' ')) - 1;
                    } catch (error) {
                        // Not A Number
                    }
                    if (!page) page = 1;
                }

                await ListUtils.updateBdayList(this.userRepo, msg.guild, msg, page);
            }
        } else if (checkJumpToPage) {
            if (titleArgs[1] === 'Messages') {
                let page: number;

                let messageTimeEmbed = new MessageEmbed()
                    .setDescription('Please input the page you would like to jump to:')
                    .setColor(Config.colors.default);

                let prompt = await channel.send(messageTimeEmbed);

                page = await CollectorUtils.collectByMessage(
                    msg.channel,
                    // Collect Filter
                    (nextMsg: Message) => nextMsg.author.id === reactor.id,
                    stopFilter,
                    // Retrieve Result
                    async (nextMsg: Message) => {
                        await ActionUtils.deleteMessage(nextMsg);
                        if (!page && page !== 0) {
                            // Try and get the time
                            let page: number;
                            try {
                                page = parseInt(nextMsg.content.split(/\s+/)[0]);
                            } catch (error) {
                                let embed = new MessageEmbed()
                                    .setDescription('Invalid page!')
                                    .setColor(Config.colors.error);
                                await channel.send(embed);
                                return;
                            }

                            page = Math.round(page);

                            if (!page || page <= 0 || page > 100000) page = 1;

                            return page;
                        }
                    },
                    expireFunction,
                    COLLECT_OPTIONS
                );

                ActionUtils.deleteMessage(prompt);

                if (page === undefined) {
                    return;
                }

                await ListUtils.updateMessageList(this.customMessageRepo, msg.guild, msg, page);
            } else if (titleArgs[1] === 'List') {
                let page: number;

                let messageTimeEmbed = new MessageEmbed()
                    .setDescription('Please input the page you would like to jump to:')
                    .setColor(Config.colors.default);

                let prompt = await channel.send(messageTimeEmbed);

                page = await CollectorUtils.collectByMessage(
                    msg.channel,
                    // Collect Filter
                    (nextMsg: Message) => nextMsg.author.id === reactor.id,
                    stopFilter,
                    // Retrieve Result
                    async (nextMsg: Message) => {
                        await ActionUtils.deleteMessage(nextMsg);
                        if (!page && page !== 0) {
                            // Try and get the time
                            let page: number;
                            try {
                                page = parseInt(nextMsg.content.split(/\s+/)[0]);
                            } catch (error) {
                                let embed = new MessageEmbed()
                                    .setDescription('Invalid page!')
                                    .setColor(Config.colors.error);
                                await channel.send(embed);
                                return;
                            }

                            page = Math.round(page);

                            if (!page || page <= 0 || page > 100000) page = 1;

                            return page;
                        }
                    },
                    expireFunction,
                    COLLECT_OPTIONS
                );

                ActionUtils.deleteMessage(prompt);

                if (page === undefined) {
                    return;
                }

                await ListUtils.updateBdayList(this.userRepo, msg.guild, msg, page);
            }
        }
    }
}
