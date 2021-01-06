import { BlacklistRepo, CustomMessageRepo, UserRepo } from '../services/database/repos';
import {
    CollectOptions,
    CollectorUtils,
    ExpireFunction,
    MessageFilter,
} from 'discord.js-collector-utils';
import {
    Collection,
    DiscordAPIError,
    Message,
    MessageEmbed,
    MessageReaction,
    TextChannel,
    User,
} from 'discord.js';
import { FormatUtils, MessageUtils, PermissionUtils } from '../utils';
import { Lang, Logger, SubscriptionService } from '../services';

import { CustomMessages } from '../models/database';
import { EventHandler } from '.';
import { LangCode } from '../models/enums';
import { ListUtils } from '../utils/list-utils';
import { PlanName } from '../models/subscription-models';
import { RateLimiter } from 'discord.js-rate-limiter';
import { TrustedRoleRepo } from '../services/database/repos/trusted-role-repo';

let Logs = require('../../lang/logs.json');
let Config = require('../../config/config.json');

const COLLECT_OPTIONS: CollectOptions = {
    time: Config.experience.promptExpireTime * 1000,
    reset: true,
};

export class ReactionAddHandler implements EventHandler {
    // Bday list limiter
    private rateLimiter = new RateLimiter(
        Config.rateLimiting.list.amount,
        Config.rateLimiting.list.interval * 1000
    );
    // Custom message list
    private messageLimiter = new RateLimiter(
        Config.rateLimiting.list.amount,
        Config.rateLimiting.list.interval * 1000
    );
    // bday blacklist list
    private blacklistLimiter = new RateLimiter(
        Config.rateLimiting.list.amount,
        Config.rateLimiting.list.interval * 1000
    );
    // user message list
    private userMessagesLimiter = new RateLimiter(
        Config.rateLimiting.list.amount,
        Config.rateLimiting.list.interval * 1000
    );
    // Trusted Role limiter
    private trustedRoleLimiter = new RateLimiter(
        Config.rateLimiting.list.amount,
        Config.rateLimiting.list.interval * 1000
    );

    constructor(
        private userRepo: UserRepo,
        private customMessageRepo: CustomMessageRepo,
        private blacklistRepo: BlacklistRepo,
        private trustedRoleRepo: TrustedRoleRepo,
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
            // Give a response as to why it can't respond? With a rate limit on the guild
            return;
        }

        // Check if the reacted emoji is one we are handling
        if (
            ![
                Config.emotes.nextPage,
                Config.emotes.previousPage,
                Config.emotes.jumpToPage,
                Config.emotes.fastReverse,
                Config.emotes.fastForward,
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
                // Error code 10003: "Unknown Channel"
                // Error code 10008: "Unknown Message" (message was deleted)
                // Error code 50001: "Missing Access"
                if (
                    error instanceof DiscordAPIError &&
                    [10003, 10008, 50001].includes(error.code)
                ) {
                    return;
                } else {
                    Logger.error(Logs.error.messagePartial, error);
                    return;
                }
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
        let checkFastRewind: boolean = msgReaction.emoji.name === Config.emotes.fastReverse;
        let checkFastForward: boolean = msgReaction.emoji.name === Config.emotes.fastForward;

        let stopFilter: MessageFilter = (nextMsg: Message) =>
            nextMsg.author.id === msg.author.id &&
            nextMsg.content.split(/\s+/)[0].toLowerCase() === Config.prefix;

        let expireFunction: ExpireFunction = async () => {
            return;
        };

        let titleArgs = msg.embeds[0]?.title?.split(/\s+/);

        if (!titleArgs) return;

        if (checkNextPage || checkPreviousPage || checkFastForward || checkFastRewind) {
            let oldPage: number;
            let page = 1;
            let pageSize: number;
            let hasPremium: boolean;
            let user = false;

            try {
                oldPage = FormatUtils.extractPageNumber(titleArgs.join(' '));
                if (!oldPage) return;
                if (checkNextPage) page = oldPage + 1;
                else if (checkFastForward) page = oldPage + Config.experience.fastForwardAmount;
                else if (checkFastRewind) page = oldPage - Config.experience.fastRewindAmount;
                else page = oldPage - 1;
            } catch (error) {
                // Not A Number
            }

            if (!page) page = 1;

            if (
                oldPage === 1 &&
                checkPreviousPage // if the old page was page 1 and they are trying to decrease
            ) {
                await MessageUtils.removeReaction(msgReaction, reactor);
                return;
            }

            if (oldPage <= Config.experience.fastRewindAmount && checkFastRewind) page = 1;

            if (msg.embeds[0]?.title?.includes(Lang.getRef('messages', LangCode.EN))) {
                pageSize = Config.experience.birthdayMessageListSize;
                let customMessageResults: CustomMessages;
                hasPremium =
                    !Config.payments.enabled ||
                    (await this.subscriptionService.hasService(PlanName.premium1, msg.guild.id));

                let type = 'birthday';

                if (titleArgs[0] === 'Member') type = 'memberanniversary';
                else if (titleArgs[0] === 'Server') type = 'serveranniversary';

                if (msg.embeds[0]?.title?.includes(Lang.getRef('user', LangCode.EN))) {
                    user = true;
                    customMessageResults = await this.customMessageRepo.getCustomMessageUserList(
                        msg.guild.id,
                        pageSize,
                        page,
                        type
                    );
                } else {
                    customMessageResults = await this.customMessageRepo.getCustomMessageList(
                        msg.guild.id,
                        pageSize,
                        page,
                        type
                    );
                }

                if (
                    oldPage >=
                        customMessageResults.stats.TotalPages -
                            Config.experience.fastRewindAmount &&
                    checkFastForward
                )
                    page = customMessageResults.stats.TotalPages;

                if (oldPage === customMessageResults.stats.TotalPages && checkNextPage) {
                    await MessageUtils.removeReaction(msgReaction, reactor);
                    return;
                }
                await ListUtils.updateMessageList(
                    customMessageResults,
                    msg.guild,
                    msg,
                    page,
                    pageSize,
                    hasPremium,
                    type,
                    user
                );
            } else if (
                msg.embeds[0]?.title?.includes(
                    Lang.getRef('birthday', LangCode.EN) + ' ' + Lang.getRef('list', LangCode.EN)
                )
            ) {
                pageSize = Config.experience.birthdayListSize;
                let users = msg.guild.members.cache.filter(member => !member.user.bot).keyArray();

                let userDataResults = await this.userRepo.getBirthdayListFull(
                    users,
                    pageSize,
                    page
                );

                if (
                    oldPage >=
                        userDataResults.stats.TotalPages - Config.experience.fastRewindAmount &&
                    checkFastForward
                )
                    page = userDataResults.stats.TotalPages;

                if (oldPage === userDataResults.stats.TotalPages && checkNextPage) {
                    await MessageUtils.removeReaction(msgReaction, reactor);
                    return;
                }

                await ListUtils.updateBdayList(userDataResults, msg.guild, msg, page, pageSize);
            } else if (msg.embeds[0]?.title?.includes(Lang.getRef('trustedRoles', LangCode.EN))) {
                pageSize = Config.experience.trustedRoleListSize;
                let trustedRoleResults = await this.trustedRoleRepo.getTrustedRoleList(
                    msg.guild.id,
                    pageSize,
                    page
                );
                hasPremium =
                    !Config.payments.enabled ||
                    (await this.subscriptionService.hasService(PlanName.premium1, msg.guild.id));

                if (
                    oldPage >=
                        trustedRoleResults.stats.TotalPages - Config.experience.fastRewindAmount &&
                    checkFastForward
                )
                    page = trustedRoleResults.stats.TotalPages;

                if (oldPage === trustedRoleResults.stats.TotalPages && checkNextPage) {
                    await MessageUtils.removeReaction(msgReaction, reactor);
                    return;
                }

                await ListUtils.updateTrustedRoleList(
                    trustedRoleResults,
                    msg.guild,
                    msg,
                    page,
                    pageSize,
                    hasPremium
                );
            } else if (msg.embeds[0]?.title?.includes(Lang.getRef('blacklist', LangCode.EN))) {
                pageSize = Config.experience.blacklistSize;
                let blacklistResults = await this.blacklistRepo.getBlacklistList(
                    msg.guild.id,
                    pageSize,
                    page
                );

                if (
                    oldPage >=
                        blacklistResults.stats.TotalPages - Config.experience.fastRewindAmount &&
                    checkFastForward
                )
                    page = blacklistResults.stats.TotalPages;

                if (oldPage === blacklistResults.stats.TotalPages && checkNextPage) {
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
            }

            await MessageUtils.removeReaction(msgReaction, reactor);
        } else if (checkJumpToPage) {
            // Jump to page
            let user = false;
            let pageSize: number;
            let hasPremium: boolean;
            let oldPage: number;
            // Check if user is rate limited

            if (msg.embeds[0]?.title?.includes(Lang.getRef('messages', LangCode.EN))) {
                user = titleArgs[0] === Lang.getRef('user', LangCode.EN);
                pageSize = Config.experience.birthdayMessageListSize;
                if (user) {
                    let limited = this.userMessagesLimiter.take(reactor.id);
                    if (limited) {
                        return;
                    }
                } else {
                    let limited = this.messageLimiter.take(reactor.id);
                    if (limited) {
                        return;
                    }
                }
            } else if (
                msg.embeds[0]?.title?.includes(
                    Lang.getRef('birthday', LangCode.EN) + ' ' + Lang.getRef('list', LangCode.EN)
                )
            ) {
                pageSize = Config.experience.birthdayListSize;
                let limited = this.rateLimiter.take(reactor.id);
                if (limited) {
                    return;
                }
            } else if (msg.embeds[0]?.title?.includes(Lang.getRef('trustedRoles', LangCode.EN))) {
                pageSize = Config.experience.trustedRoleListSize;
                let limited = this.trustedRoleLimiter.take(reactor.id);
                if (limited) {
                    return;
                }
            } else if (msg.embeds[0]?.title?.includes(Lang.getRef('blacklist', LangCode.EN))) {
                pageSize = Config.experience.blacklistSize;
                let limited = this.blacklistLimiter.take(reactor.id);
                if (limited) {
                    return;
                }
            }

            let page: number;

            let prompt = await MessageUtils.send(channel, Lang.getEmbed('inputPage', LangCode.EN));

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
                            await MessageUtils.send(
                                channel,
                                Lang.getEmbed('invalidPage', LangCode.EN)
                            );
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

            try {
                oldPage = FormatUtils.extractPageNumber(titleArgs.join(' '));
                if (oldPage === page) return;
            } catch (error) {
                // Not A Number
            }

            if (msg.embeds[0]?.title?.includes(Lang.getRef('messages', LangCode.EN))) {
                let customMessageResults: CustomMessages;
                hasPremium =
                    !Config.payments.enabled ||
                    (await this.subscriptionService.hasService(PlanName.premium1, msg.guild.id));

                let type = 'birthday';

                if (titleArgs[0] === 'Member') type = 'memberanniversary';
                else if (titleArgs[0] === 'Server') type = 'serveranniversary';
                if (user) {
                    customMessageResults = await this.customMessageRepo.getCustomMessageUserList(
                        msg.guild.id,
                        pageSize,
                        page,
                        'birthday'
                    );
                } else {
                    customMessageResults = await this.customMessageRepo.getCustomMessageList(
                        msg.guild.id,
                        pageSize,
                        page,
                        type
                    );
                }
                await ListUtils.updateMessageList(
                    customMessageResults,
                    msg.guild,
                    msg,
                    page,
                    pageSize,
                    hasPremium,
                    type,
                    user
                );
            } else if (
                msg.embeds[0]?.title?.includes(
                    Lang.getRef('birthday', LangCode.EN) + ' ' + Lang.getRef('list', LangCode.EN)
                )
            ) {
                let users = msg.guild.members.cache.filter(member => !member.user.bot).keyArray();

                let userDataResults = await this.userRepo.getBirthdayListFull(
                    users,
                    pageSize,
                    page
                );

                await ListUtils.updateBdayList(userDataResults, msg.guild, msg, page, pageSize);
            } else if (msg.embeds[0]?.title?.includes(Lang.getRef('trustedRoles', LangCode.EN))) {
                let trustedRoleResults = await this.trustedRoleRepo.getTrustedRoleList(
                    msg.guild.id,
                    pageSize,
                    page
                );

                hasPremium =
                    !Config.payments.enabled ||
                    (await this.subscriptionService.hasService(PlanName.premium1, msg.guild.id));

                await ListUtils.updateTrustedRoleList(
                    trustedRoleResults,
                    msg.guild,
                    msg,
                    page,
                    pageSize,
                    hasPremium
                );
            } else if (msg.embeds[0]?.title?.includes(Lang.getRef('blacklist', LangCode.EN))) {
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
            }
            await MessageUtils.removeReaction(msgReaction, reactor);
        }
    }
}
