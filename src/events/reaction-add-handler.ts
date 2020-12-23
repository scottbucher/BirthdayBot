import { BlacklistRepo, CustomMessageRepo, UserRepo } from '../services/database/repos';
import {
    CollectOptions,
    CollectorUtils,
    ExpireFunction,
    MessageFilter,
} from 'discord.js-collector-utils';
import { Collection, Message, MessageEmbed, MessageReaction, TextChannel, User } from 'discord.js';
import { FormatUtils, MessageUtils, PermissionUtils } from '../utils';
import { Logger, SubscriptionService } from '../services';

import { EventHandler } from '.';
import { ListUtils } from '../utils/list-utils';
import { PlanName } from '../models/subscription-models';
import { RateLimiter } from 'discord.js-rate-limiter';

let Logs = require('../../lang/logs.json');
let Config = require('../../config/config.json');

const COLLECT_OPTIONS: CollectOptions = {
    time: Config.experience.promptExpireTime * 1000,
    reset: true,
};

export class ReactionAddHandler implements EventHandler {
    private rateLimiter = new RateLimiter(
        Config.rateLimiting.list.amount,
        Config.rateLimiting.list.interval * 1000
    );
    private messageLimiter = new RateLimiter(
        Config.rateLimiting.commands.amount,
        Config.rateLimiting.commands.interval * 1000
    );
    private blacklistLimiter = new RateLimiter(
        Config.rateLimiting.commands.amount,
        Config.rateLimiting.commands.interval * 1000
    );
    private userMessagesLimiter = new RateLimiter(
        Config.rateLimiting.commands.amount,
        Config.rateLimiting.commands.interval * 1000
    );

    constructor(
        private userRepo: UserRepo,
        private customMessageRepo: CustomMessageRepo,
        private blacklistRepo: BlacklistRepo,
        private subscriptionService: SubscriptionService
    ) {}

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
        if (msgReaction.message?.partial) {
            try {
                msg = await msgReaction.message?.fetch();
            } catch (error) {
                Logger.error(Logs.error.messagePartial, error);
                return;
            }
        } else {
            msg = msgReaction.message;
        }

        let users: Collection<string, User>;
        try {
            users = await msgReaction?.users.fetch();
        } catch (error) {
            Logger.error(Logs.error.userFetch, error);
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
                let oldPage: number;
                let page = 1;
                let pageSize = Config.experience.birthdayMessageListSize;

                if (titleArgs[4]) {
                    try {
                        oldPage = FormatUtils.extractPageNumber(titleArgs.join(' '));
                        if (checkNextPage) page = oldPage + 1;
                        else page = oldPage - 1;
                    } catch (error) {
                        // Not A Number
                    }
                    if (!page) page = 1;
                }

                let customMessageResults = await this.customMessageRepo.getCustomMessageList(
                    msg.guild.id,
                    pageSize,
                    page,
                    'birthday'
                );

                if (
                    (oldPage === 1 && checkPreviousPage) || // if the old page was page 1 and they are trying to decrease
                    (oldPage === customMessageResults.stats.TotalPages && checkNextPage) // if the  old page was the max page and they are trying to increase
                ) {
                    await MessageUtils.removeReaction(msgReaction, reactor);
                    return;
                }

                let hasPremium = Config.payments.enabled
                    ? await this.subscriptionService.hasService(PlanName.premium1, msg.guild.id)
                    : false;

                await ListUtils.updateMessageList(
                    customMessageResults,
                    msg.guild,
                    msg,
                    page,
                    pageSize,
                    hasPremium
                );

                await MessageUtils.removeReaction(msgReaction, reactor);
            } else if (titleArgs[0] === 'User') {
                let oldPage: number;
                let page = 1;
                let pageSize = Config.experience.birthdayMessageListSize;

                if (titleArgs[5]) {
                    try {
                        oldPage = FormatUtils.extractPageNumber(titleArgs.join(' '));
                        if (checkNextPage) page = oldPage + 1;
                        else page = oldPage - 1;
                    } catch (error) {
                        // Not A Number
                    }
                    if (!page) page = 1;
                }

                let customMessageResults = await this.customMessageRepo.getCustomMessageUserList(
                    msg.guild.id,
                    pageSize,
                    page,
                    'birthday'
                );

                if (
                    (oldPage === 1 && checkPreviousPage) || // if the old page was page 1 and they are trying to decrease
                    (oldPage === customMessageResults.stats.TotalPages && checkNextPage) // if the  old page was the max page and they are trying to increase
                ) {
                    await MessageUtils.removeReaction(msgReaction, reactor);
                    return;
                }

                let hasPremium = Config.payments.enabled
                    ? await this.subscriptionService.hasService(PlanName.premium1, msg.guild.id)
                    : false;

                await ListUtils.updateMessageUserList(
                    customMessageResults,
                    msg.guild,
                    msg,
                    page,
                    pageSize,
                    hasPremium
                );

                await MessageUtils.removeReaction(msgReaction, reactor);
            } else if (titleArgs[1] === 'List') {
                let oldPage: number;
                let page = 1;
                let pageSize = Config.experience.birthdayListSize;

                let users = msg.guild.members.cache.filter(member => !member.user.bot).keyArray();

                if (titleArgs[4]) {
                    try {
                        oldPage = FormatUtils.extractPageNumber(titleArgs.join(' '));
                        if (checkNextPage) page = oldPage + 1;
                        else page = oldPage - 1;
                    } catch (error) {
                        // Not A Number
                    }
                    if (!page) page = 1;
                }

                let userDataResults = await this.userRepo.getBirthdayListFull(
                    users,
                    pageSize,
                    page
                );

                if (
                    (oldPage === 1 && checkPreviousPage) || // if the old page was page 1 and they are trying to decrease
                    (oldPage === userDataResults.stats.TotalPages && checkNextPage) // if the  old page was the max page and they are trying to increase
                ) {
                    await MessageUtils.removeReaction(msgReaction, reactor);
                    return;
                }

                await ListUtils.updateBdayList(userDataResults, msg.guild, msg, page, pageSize);

                await MessageUtils.removeReaction(msgReaction, reactor);
            } else if (titleArgs[1] === 'Blacklist') {
                let oldPage: number;
                let page = 1;
                let pageSize = Config.experience.blacklistSize;

                if (titleArgs[4]) {
                    try {
                        oldPage = FormatUtils.extractPageNumber(titleArgs.join(' '));
                        if (checkNextPage) page = oldPage + 1;
                        else page = oldPage - 1;
                    } catch (error) {
                        // Not A Number
                    }
                    if (!page) page = 1;
                }

                let blacklistResults = await this.blacklistRepo.getBlacklistList(
                    msg.guild.id,
                    pageSize,
                    page
                );

                if (
                    (oldPage === 1 && checkPreviousPage) || // if the old page was page 1 and they are trying to decrease
                    (oldPage === blacklistResults.stats.TotalPages && checkNextPage) // if the  old page was the max page and they are trying to increase
                ) {
                    await MessageUtils.removeReaction(msgReaction, reactor);
                    return;
                }

                await ListUtils.updateBlacklistList(
                    blacklistResults,
                    msg.guild,
                    msg,
                    page,
                    pageSize
                );

                await MessageUtils.removeReaction(msgReaction, reactor);
            }
        } else if (checkJumpToPage) {
            if (titleArgs[1] === 'Messages') {
                // Check if user is rate limited
                let limited = this.messageLimiter.take(reactor.id);
                if (limited) {
                    return;
                }
                let page: number;

                let messageTimeEmbed = new MessageEmbed()
                    .setDescription('Please input the page you would like to jump to:')
                    .setColor(Config.colors.default);

                let prompt = await MessageUtils.send(channel, messageTimeEmbed);

                page = await CollectorUtils.collectByMessage(
                    msg.channel,
                    // Collect Filter
                    (nextMsg: Message) => nextMsg.author.id === reactor.id,
                    stopFilter,
                    // Retrieve Result
                    async (nextMsg: Message) => {
                        await MessageUtils.delete(nextMsg);
                        if (!page && page !== 0) {
                            // Try and get the time
                            let page: number;
                            try {
                                page = parseInt(nextMsg.content.split(/\s+/)[0]);
                            } catch (error) {
                                let embed = new MessageEmbed()
                                    .setDescription('Invalid page!')
                                    .setColor(Config.colors.error);
                                await MessageUtils.send(channel, embed);
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

                MessageUtils.delete(prompt);

                if (page === undefined) return;

                let pageSize = Config.experience.birthdayMessageListSize;

                let customMessageResults = await this.customMessageRepo.getCustomMessageList(
                    msg.guild.id,
                    pageSize,
                    page,
                    'birthday'
                );

                let hasPremium = Config.payments.enabled
                    ? await this.subscriptionService.hasService(PlanName.premium1, msg.guild.id)
                    : false;

                await ListUtils.updateMessageList(
                    customMessageResults,
                    msg.guild,
                    msg,
                    page,
                    pageSize,
                    hasPremium
                );

                await MessageUtils.removeReaction(msgReaction, reactor);
            } else if (titleArgs[0] === 'User') {
                // Check if user is rate limited
                let limited = this.userMessagesLimiter.take(reactor.id);
                if (limited) {
                    return;
                }
                let page: number;

                let messageTimeEmbed = new MessageEmbed()
                    .setDescription('Please input the page you would like to jump to:')
                    .setColor(Config.colors.default);

                let prompt = await MessageUtils.send(channel, messageTimeEmbed);

                page = await CollectorUtils.collectByMessage(
                    msg.channel,
                    // Collect Filter
                    (nextMsg: Message) => nextMsg.author.id === reactor.id,
                    stopFilter,
                    // Retrieve Result
                    async (nextMsg: Message) => {
                        await MessageUtils.delete(nextMsg);
                        if (!page && page !== 0) {
                            // Try and get the time
                            let page: number;
                            try {
                                page = parseInt(nextMsg.content.split(/\s+/)[0]);
                            } catch (error) {
                                let embed = new MessageEmbed()
                                    .setDescription('Invalid page!')
                                    .setColor(Config.colors.error);
                                await MessageUtils.send(channel, embed);
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

                MessageUtils.delete(prompt);

                if (page === undefined) return;

                let pageSize = Config.experience.birthdayMessageListSize;

                let customMessageResults = await this.customMessageRepo.getCustomMessageUserList(
                    msg.guild.id,
                    pageSize,
                    page,
                    'birthday'
                );

                let hasPremium = Config.payments.enabled
                    ? await this.subscriptionService.hasService(PlanName.premium1, msg.guild.id)
                    : false;

                await ListUtils.updateMessageUserList(
                    customMessageResults,
                    msg.guild,
                    msg,
                    page,
                    pageSize,
                    hasPremium
                );

                await MessageUtils.removeReaction(msgReaction, reactor);
            } else if (titleArgs[1] === 'List') {
                let page: number;
                // Check if user is rate limited
                let limited = this.rateLimiter.take(reactor.id);
                if (limited) {
                    return;
                }

                let messageTimeEmbed = new MessageEmbed()
                    .setDescription('Please input the page you would like to jump to:')
                    .setColor(Config.colors.default);

                let prompt = await MessageUtils.send(channel, messageTimeEmbed);

                page = await CollectorUtils.collectByMessage(
                    msg.channel,
                    // Collect Filter
                    (nextMsg: Message) => nextMsg.author.id === reactor.id,
                    stopFilter,
                    // Retrieve Result
                    async (nextMsg: Message) => {
                        await MessageUtils.delete(nextMsg);
                        if (!page && page !== 0) {
                            // Try and get the time
                            let page: number;
                            try {
                                page = parseInt(nextMsg.content.split(/\s+/)[0]);
                            } catch (error) {
                                let embed = new MessageEmbed()
                                    .setDescription('Invalid page!')
                                    .setColor(Config.colors.error);
                                await MessageUtils.send(channel, embed);
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

                MessageUtils.delete(prompt);

                if (page === undefined) {
                    return;
                }

                let pageSize = Config.experience.birthdayListSize;

                let users = msg.guild.members.cache.filter(member => !member.user.bot).keyArray();

                let userDataResults = await this.userRepo.getBirthdayListFull(
                    users,
                    pageSize,
                    page
                );

                await ListUtils.updateBdayList(userDataResults, msg.guild, msg, page, pageSize);

                await MessageUtils.removeReaction(msgReaction, reactor);
            } else if (titleArgs[1] === 'Blacklist') {
                let page: number;
                // Check if user is rate limited
                let limited = this.blacklistLimiter.take(reactor.id);
                if (limited) {
                    return;
                }

                let messageTimeEmbed = new MessageEmbed()
                    .setDescription('Please input the page you would like to jump to:')
                    .setColor(Config.colors.default);

                let prompt = await MessageUtils.send(channel, messageTimeEmbed);

                page = await CollectorUtils.collectByMessage(
                    msg.channel,
                    // Collect Filter
                    (nextMsg: Message) => nextMsg.author.id === reactor.id,
                    stopFilter,
                    // Retrieve Result
                    async (nextMsg: Message) => {
                        await MessageUtils.delete(nextMsg);
                        if (!page && page !== 0) {
                            // Try and get the time
                            let page: number;
                            try {
                                page = parseInt(nextMsg.content.split(/\s+/)[0]);
                            } catch (error) {
                                let embed = new MessageEmbed()
                                    .setDescription('Invalid page!')
                                    .setColor(Config.colors.error);
                                await MessageUtils.send(channel, embed);
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

                MessageUtils.delete(prompt);

                if (page === undefined) return;

                let pageSize = Config.experience.blacklistSize;

                let blacklistResults = await this.blacklistRepo.getBlacklistList(
                    msg.guild.id,
                    pageSize,
                    page
                );

                await ListUtils.updateBlacklistList(
                    blacklistResults,
                    msg.guild,
                    msg,
                    page,
                    pageSize
                );

                await MessageUtils.removeReaction(msgReaction, reactor);
            }
        }
    }
}
