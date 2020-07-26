import { Collection, Message, MessageReaction, TextChannel, User } from 'discord.js';
import { CustomMessageRepo, UserRepo } from '../services/database/repos';
import { FormatUtils, PermissionUtils } from '../utils';

import { EventHandler } from '.';
import { Logger } from '../services';

let Logs = require('../../lang/logs.json');
let Config = require('../../config/config.json');

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
            ![Config.emotes.nextPage, Config.emotes.previousPage].includes(msgReaction.emoji.name)
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
            Logger.error(Logs.error.userFetch, error);
            return;
        }

        // Check if the reacted message was sent by the bot
        if (msgReaction.message.author !== msgReaction.message.client.user) {
            return;
        }

        // Check if bot has reacted to the message before
        if (!users.find(user => user === msg.client.user)) {
            return;
        }

        let checkNextPage: boolean = msgReaction.emoji.name === Config.emotes.nextPage;
        let checkPreviousPage: boolean = msgReaction.emoji.name === Config.emotes.previousPage;

        if (checkNextPage || checkPreviousPage) {
            let titleArgs = msg.embeds[0]?.title?.split(/\s+/);

            if (!titleArgs) return;

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

                let pageSize = Config.birthdayMessageListSize;

                let customMessageResults = await this.customMessageRepo.getCustomMessageList(
                    msg.guild.id,
                    pageSize,
                    page
                );

                if (page > customMessageResults.stats.TotalPages)
                    page = customMessageResults.stats.TotalPages;

                let embed = await FormatUtils.getCustomMessageListEmbed(
                    msg.guild,
                    customMessageResults,
                    page,
                    pageSize
                );

                let message = await msg.edit(embed);

                await message.reactions.removeAll();

                if (embed.description === '**No Custom Birthday Messages!**') return;

                if (page !== 1) await message.react(Config.emotes.previousPage);
                if (customMessageResults.stats.TotalPages > page)
                    await message.react(Config.emotes.nextPage);
            } else if (titleArgs[1] === 'List') {
                let titleArgs = msg.embeds[0]?.title?.split(/\s+/);

                if (!titleArgs) return;
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

                let pageSize = Config.birthdayListSize;

                let users = msg.guild.members.cache.filter(member => !member.user.bot).keyArray();

                let userDataResults = await this.userRepo.getBirthdayListFull(
                    users,
                    pageSize,
                    page
                );

                if (page > userDataResults.stats.TotalPages)
                    page = userDataResults.stats.TotalPages;

                let embed = await FormatUtils.getBirthdayListFullEmbed(
                    msg.guild,
                    userDataResults,
                    page,
                    pageSize
                );

                let message = await msg.edit(embed);

                await message.reactions.removeAll();

                if (embed.description === '**No Birthdays in this server!**') return;

                if (page !== 1) await message.react(Config.emotes.previousPage);
                if (userDataResults.stats.TotalPages > page)
                    await message.react(Config.emotes.nextPage);
            }
        }
    }
}
