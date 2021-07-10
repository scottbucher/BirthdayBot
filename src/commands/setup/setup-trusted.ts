import {
    CollectOptions,
    CollectorUtils,
    ExpireFunction,
    MessageFilter,
} from 'discord.js-collector-utils';
import { Message, MessageReaction, TextChannel, User } from 'discord.js';

import { GuildRepo } from '../../services/database/repos';
import { Lang } from '../../services';
import { LangCode } from '../../models/enums';
import { MessageUtils } from '../../utils';

let Config = require('../../../config/config.json');

const COLLECT_OPTIONS: CollectOptions = {
    time: Config.experience.promptExpireTime * 1000,
    reset: true,
};

export class SetupTrusted {
    constructor(private guildRepo: GuildRepo) {}

    public async execute(
        args: string[],
        msg: Message,
        channel: TextChannel,
        hasPremium: boolean
    ): Promise<void> {
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

        let preventMessage: number;
        let preventRole: number;
        let requireAllTrustedRoles: number = 1;

        let trustedPreventsRoleEmbed = Lang.getEmbed(
            'serverPrompts.trustedSetupPreventsRole',
            LangCode.EN_US,
            {
                ICON: msg.client.user.avatarURL(),
            }
        );

        let trueFalseOptions = [Config.emotes.confirm, Config.emotes.deny];

        let trustedPreventsRoleMessage = await MessageUtils.send(channel, trustedPreventsRoleEmbed); // Send confirmation and emotes
        for (let option of trueFalseOptions) {
            await MessageUtils.react(trustedPreventsRoleMessage, option);
        }

        let trustedPreventsRoleOptions: string = await CollectorUtils.collectByReaction(
            trustedPreventsRoleMessage,
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

        await MessageUtils.delete(trustedPreventsRoleMessage);

        if (trustedPreventsRoleOptions === undefined) return;

        let trustedPreventsMessageEmbed = Lang.getEmbed(
            'serverPrompts.trustedSetupPreventsMessage',
            LangCode.EN_US,
            {
                ICON: msg.client.user.avatarURL(),
            }
        );

        let trustedPreventsMessageMessage = await MessageUtils.send(
            channel,
            trustedPreventsMessageEmbed
        ); // Send confirmation and emotes
        for (let option of trueFalseOptions) {
            await trustedPreventsMessageMessage.react(option);
        }

        let trustedPreventsMessageOptions: string = await CollectorUtils.collectByReaction(
            trustedPreventsMessageMessage,
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

        await MessageUtils.delete(trustedPreventsMessageMessage);

        if (trustedPreventsMessageOptions === undefined) return;

        if (hasPremium) {
            let requireAllTrustedRolesEmbed = Lang.getEmbed(
                'serverPrompts.trustedSetupRequireAll',
                LangCode.EN_US,
                {
                    ICON: msg.client.user.avatarURL(),
                }
            );

            let requireAllTrustedRolesMessage = await MessageUtils.send(
                channel,
                requireAllTrustedRolesEmbed
            ); // Send confirmation and emotes
            for (let option of trueFalseOptions) {
                await requireAllTrustedRolesMessage.react(option);
            }

            let requireAllTrustedRolesOptions: string = await CollectorUtils.collectByReaction(
                requireAllTrustedRolesMessage,
                // Collect Filter
                (msgReaction: MessageReaction, reactor: User) =>
                    reactor.id === msg.author.id &&
                    trueFalseOptions.includes(msgReaction.emoji.name),
                stopFilter,
                // Retrieve Result
                async (msgReaction: MessageReaction, reactor: User) => {
                    return msgReaction.emoji.name;
                },
                expireFunction,
                COLLECT_OPTIONS
            );

            await MessageUtils.delete(requireAllTrustedRolesMessage);

            if (requireAllTrustedRolesOptions === undefined) return;

            requireAllTrustedRoles =
                requireAllTrustedRolesOptions === Config.emotes.confirm ? 1 : 0;
        }

        preventRole = trustedPreventsMessageOptions === Config.emotes.confirm ? 1 : 0;
        preventMessage = trustedPreventsRoleOptions === Config.emotes.confirm ? 1 : 0;

        let embed = hasPremium
            ? Lang.getEmbed('results.trustedSetupPremium', LangCode.EN_US, {
                  PREVENTS_ROLE: preventRole === 1 ? 'True' : 'False',
                  PREVENTS_MESSAGE: preventMessage === 1 ? 'True' : 'False',
                  REQUIRE_ALL_ROLES: requireAllTrustedRoles === 1 ? 'True' : 'False',
                  ICON: msg.client.user.avatarURL(),
              })
            : Lang.getEmbed('results.trustedSetup', LangCode.EN_US, {
                  PREVENTS_ROLE: preventRole === 1 ? 'True' : 'False',
                  PREVENTS_MESSAGE: preventMessage === 1 ? 'True' : 'False',
                  ICON: msg.client.user.avatarURL(),
              });

        await MessageUtils.send(channel, embed);

        await this.guildRepo.guildSetupTrusted(
            guild.id,
            requireAllTrustedRoles,
            preventMessage,
            preventRole
        );
    }
}
