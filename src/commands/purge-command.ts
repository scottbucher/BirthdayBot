import {
    CollectOptions,
    CollectorUtils,
    ExpireFunction,
    MessageFilter,
} from 'discord.js-collector-utils';
import { DMChannel, Message, MessageReaction, TextChannel, User } from 'discord.js';

import { Command } from './command';
import { Lang } from '../services';
import { LangCode } from '../models/enums';
import { MessageUtils } from '../utils';
import { UserRepo } from '../services/database/repos';

let Config = require('../../config/config.json');

const COLLECT_OPTIONS: CollectOptions = {
    time: Config.experience.promptExpireTime * 1000,
    reset: true,
};

export class PurgeCommand implements Command {
    public name: string = 'purge';
    public aliases = ['cleardata'];
    public requireSetup = false;
    public guildOnly = false;
    public adminOnly = false;
    public ownerOnly = false;
    public voteOnly = false;
    public requirePremium = false;
    public getPremium = false;

    constructor(private userRepo: UserRepo) {}

    async execute(args: string[], msg: Message, channel: TextChannel | DMChannel): Promise<void> {
        let target = msg.author;
        let userData = await this.userRepo.getUser(target.id); // Try and get their data
        let changesLeft = 0;
        let stopFilter: MessageFilter = (nextMsg: Message) =>
            nextMsg.author.id === msg.author.id &&
            nextMsg.content.split(/\s+/)[0].toLowerCase() === Config.prefix;
        let expireFunction: ExpireFunction = async () => {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.purgeExpired', LangCode.EN_US)
            );
        };

        if (!userData || !(userData.Birthday && userData.TimeZone)) {
            // Are they in the database?
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.birthdayNotSet', LangCode.EN_US)
            );
            return;
        } else {
            changesLeft = userData.ChangesLeft;
        }

        let trueFalseOptions = [Config.emotes.confirm, Config.emotes.deny];

        let confirmationMessage = await MessageUtils.send(
            channel,
            Lang.getEmbed('userPrompts.birthdayConfirmPurge', LangCode.EN_US, {
                CHANGES_LEFT: changesLeft.toString(),
                APPEND:
                    changesLeft === 0 ? Lang.getRef('prompts.outOfAttemtps', LangCode.EN_US) : '',
            })
        ); // Send confirmation and emotes
        for (let option of trueFalseOptions) {
            await MessageUtils.react(confirmationMessage, option);
        }

        let confirmation: string = await CollectorUtils.collectByReaction(
            confirmationMessage,
            // Collect Filter
            (msgReaction: MessageReaction, reactor: User) =>
                reactor.id === target.id && trueFalseOptions.includes(msgReaction.emoji.name),
            stopFilter,
            // Retrieve Result
            async (msgReaction: MessageReaction, reactor: User) => {
                return msgReaction.emoji.name;
            },
            expireFunction,
            COLLECT_OPTIONS
        );

        MessageUtils.delete(confirmationMessage);

        if (confirmation === undefined) return;

        if (confirmation === Config.emotes.confirm) {
            // Confirm
            await this.userRepo.addOrUpdateUser(target.id, null, null, changesLeft); // Add or update user

            await MessageUtils.send(
                channel,
                Lang.getEmbed('results.purgeSuccessful', LangCode.EN_US)
            );
        } else if (confirmation === Config.emotes.deny) {
            // Cancel
            await MessageUtils.send(
                channel,
                Lang.getEmbed('results.actionCanceled', LangCode.EN_US)
            );
        }
    }
}
