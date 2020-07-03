import { Collection, Message, MessageReaction, TextChannel, User } from 'discord.js';

import { EventHandler } from '.';
import { Logger } from '../services';
import { UserRepo } from '../services/database/repos';
import { CustomMessageRepo } from '../services/database/repos/custom-message-repo';
import { FormatUtils, PermissionUtils } from '../utils';

let Logs = require('../../lang/logs.json');
let Config = require('../../config/config.json');

export class ReactionAddHandler implements EventHandler {
    constructor(private userRepo: UserRepo, private customMessageRepo: CustomMessageRepo) {}

    public async process(messageReaction: MessageReaction, author: User): Promise<void> {
        if (author.bot || !(messageReaction.message.channel instanceof TextChannel)) return;

        let channel = messageReaction.message.channel as TextChannel;

        if (
            !PermissionUtils.canSend(channel) ||
            !PermissionUtils.canHandleReaction(channel) ||
            !PermissionUtils.canReact(channel)
        )
            return;

        let msg: Message;

        if (messageReaction.message.partial) {
            try {
                msg = await messageReaction.message.fetch();
            } catch (error) {
                Logger.error(Logs.error.messagePartial, error);
                return;
            }
        } else {
            msg = messageReaction.message;
        }

        let reactor = msg.guild.members.resolve(author);

        let users: Collection<string, User>;

        if (
            messageReaction.emoji.name !== Config.emotes.nextPage &&
            messageReaction.emoji.name !== Config.emotes.previousPage
        ) {
            return;
        }

        try {
            users = await messageReaction.users.fetch();
        } catch (error) {
            Logger.error(Logs.error.userFetch, error);
            return;
        }

        let checkNextPage: boolean =
            messageReaction.emoji.name === Config.emotes.nextPage &&
            users.find(user => user.id === reactor.id) !== null &&
            users.find(user => user.id === msg.client.user.id) !== null;

        let checkPreviousPage: boolean =
            messageReaction.emoji.name === Config.emotes.previousPage &&
            users.find(user => user.id === reactor.id) !== null &&
            users.find(user => user.id === msg.client.user.id) !== null;

        if (checkNextPage || checkPreviousPage) {
            let titleArgs = msg.embeds[0]?.title?.split(' ');

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
                let titleArgs = msg.embeds[0]?.title?.split(' ');

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
                    msg.guild.id,
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
