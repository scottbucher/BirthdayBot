import {
    CollectOptions,
    CollectorUtils,
    ExpireFunction,
    MessageFilter,
} from 'discord.js-collector-utils';
import { FormatUtils, MessageUtils } from '../../utils';
import { Message, MessageReaction, TextChannel, User } from 'discord.js';

import { CustomMessageRepo } from '../../services/database/repos';
import { Lang } from '../../services';
import { LangCode } from '../../models/enums';

let Config = require('../../../config/config.json');

const COLLECT_OPTIONS: CollectOptions = {
    time: Config.experience.promptExpireTime * 1000,
    reset: true,
};

export class MessageClearSubCommand {
    constructor(private customMessageRepo: CustomMessageRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel): Promise<void> {
        let stopFilter: MessageFilter = (nextMsg: Message) =>
            nextMsg.author.id === msg.author.id &&
            [Config.prefix, ...Config.stopCommands].includes(
                nextMsg.content.split(/\s+/)[0].toLowerCase()
            );
        let expireFunction: ExpireFunction = async () => {
            await MessageUtils.reply(msg, Lang.getEmbed('results.promptExpired', LangCode.EN_US));
        };

        let type = FormatUtils.extractCelebrationType(args[3]?.toLowerCase());

        if (
            type !== 'birthday' &&
            type !== 'memberanniversary' &&
            type !== 'serveranniversary' &&
            type !== 'userspecificbirthday' &&
            type !== 'userspecificmemberanniversary'
        ) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.clearMessageInvalidType', LangCode.EN_US, {
                    ICON: msg.client.user.avatarURL(),
                })
            );
            return;
        }

        let customMessages = type.includes('user')
            ? await this.customMessageRepo.getCustomUserMessages(
                  msg.guild.id,
                  type.includes('birthday') ? 'birthday' : 'memberanniversary'
              )
            : await this.customMessageRepo.getCustomMessages(msg.guild.id, type);

        let totalMessages = customMessages.customMessages.length;
        // If it is a 0 the custom message technically needs a plural
        let displayType: string = FormatUtils.getCelebrationDisplayType(
            type,
            totalMessages !== 1
        ).toLowerCase();

        if (totalMessages === 0) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.noCustomMessagesGeneric', LangCode.EN_US, {
                    DISPLAY_TYPE: displayType,
                })
            );
            return;
        }

        let trueFalseOptions = [Config.emotes.confirm, Config.emotes.deny];

        let confirmationMessage = await MessageUtils.send(
            channel,
            Lang.getEmbed('serverPrompts.confirmClearMessages', LangCode.EN_US, {
                MESSAGE_COUNT: totalMessages.toString(),
                DISPLAY_TYPE: FormatUtils.getCelebrationDisplayType(
                    type,
                    totalMessages > 1
                ).toLowerCase(),
                ICON: msg.client.user.avatarURL(),
            })
        );

        // Send confirmation and emotes
        for (let option of trueFalseOptions) {
            await MessageUtils.react(confirmationMessage, option);
        }

        let confirmation: string = await CollectorUtils.collectByReaction(
            confirmationMessage,
            // Collect Filter
            (msgReaction: MessageReaction, reactor: User) =>
                reactor.id === msg.author.id && trueFalseOptions.includes(msgReaction.emoji.name),
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

            type.includes('user')
                ? await this.customMessageRepo.clearCustomUserMessages(
                      msg.guild.id,
                      type.includes('birthday') ? 'birthday' : 'memberanniversary'
                  )
                : await this.customMessageRepo.clearCustomMessages(msg.guild.id, type);

            await MessageUtils.send(
                channel,
                Lang.getEmbed('results.customMessagesCleared', LangCode.EN_US, {
                    DISPLAY_TYPE: displayType,
                })
            );
        } else {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('results.actionCanceled', LangCode.EN_US)
            );
        }
    }
}
