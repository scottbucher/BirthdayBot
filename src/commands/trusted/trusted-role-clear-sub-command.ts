import {
    CollectOptions,
    CollectorUtils,
    ExpireFunction,
    MessageFilter,
} from 'discord.js-collector-utils';
import { Message, MessageReaction, TextChannel, User } from 'discord.js';

import { Lang } from '../../services';
import { LangCode } from '../../models/enums';
import { MessageUtils } from '../../utils';
import { TrustedRoleRepo } from '../../services/database/repos/trusted-role-repo';

let Config = require('../../../config/config.json');

const COLLECT_OPTIONS: CollectOptions = {
    time: Config.experience.promptExpireTime * 1000,
    reset: true,
};

export class TrustedRoleClearSubCommand {
    constructor(private trustedRoleRepo: TrustedRoleRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel): Promise<void> {
        let stopFilter: MessageFilter = (nextMsg: Message) =>
            nextMsg.author.id === msg.author.id &&
            [Config.prefix, ...Config.stopCommands].includes(
                nextMsg.content.split(/\s+/)[0].toLowerCase()
            );
        let expireFunction: ExpireFunction = async () => {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('results.trustedRoleClearExpired', LangCode.EN_US)
            );
        };

        let trustedRoles = await this.trustedRoleRepo.getTrustedRoles(msg.guild.id);

        if (trustedRoles.trustedRoles.length === 0) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.noTrustedRoles', LangCode.EN_US)
            );
            return;
        }

        let trueFalseOptions = [Config.emotes.confirm, Config.emotes.deny];

        let confirmationMessage = await MessageUtils.send(
            channel,
            Lang.getEmbed('serverPrompts.trustedRoleClearConfirmation', LangCode.EN_US, {
                TOTAL: trustedRoles.trustedRoles.length.toString(),
            })
        ); // Send confirmation and emotes
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
            await this.trustedRoleRepo.clearTrustedRoles(msg.guild.id);
            await MessageUtils.send(
                channel,
                Lang.getEmbed('results.clearedTrustedRole', LangCode.EN_US)
            );
        } else {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('results.actionCanceled', LangCode.EN_US)
            );
        }
    }
}
