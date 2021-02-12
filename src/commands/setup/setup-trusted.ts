import {
    CollectOptions,
    CollectorUtils,
    ExpireFunction,
    MessageFilter,
} from 'discord.js-collector-utils';
import { Message, MessageEmbed, MessageReaction, Role, TextChannel, User } from 'discord.js';

import { GuildRepo } from '../../services/database/repos';
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
        let botUser = guild.client.user;
        let stopFilter: MessageFilter = (nextMsg: Message) =>
            nextMsg.author.id === msg.author.id &&
            [Config.prefix, ...Config.stopCommands].includes(
                nextMsg.content.split(/\s+/)[0].toLowerCase()
            );
        let expireFunction: ExpireFunction = async () => {
            await MessageUtils.send(
                channel,
                new MessageEmbed()
                    .setTitle('Trusted Setup - Expired')
                    .setDescription('Type `bday setup trusted` to rerun the setup.')
                    .setColor(Config.colors.error)
            );
        };

        let preventMessage: number;
        let preventRole: number;
        let requireAllTrustedRoles: number = 1;

        let trustedPreventsRoleEmbed = new MessageEmbed()
            .setAuthor(`${guild.name}`, guild.iconURL())
            .setTitle('Trusted Setup - Trusted Prevents Message')
            .setDescription(
                `Should the trusted role prevent the birthday message? [(?)](${Config.links.docs}/faq#what-is-the-trusted-prevents-message-role)` +
                    `\n\nTrue: ${Config.emotes.confirm}` +
                    `\nFalse: ${Config.emotes.deny}`
            )
            .setFooter(`This message expires in 2 minutes!`, botUser.avatarURL())
            .setColor(Config.colors.default)
            .setTimestamp();

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

        let trustedPreventsMessageEmbed = new MessageEmbed()
            .setAuthor(`${guild.name}`, guild.iconURL())
            .setTitle('Trusted Setup - Trusted Prevents Role')
            .setDescription(
                `Should the trusted role prevent the birthday role? [(?)](${Config.links.docs}/faq#what-is-the-trusted-prevents-message-role)` +
                    `\n\nTrue: ${Config.emotes.confirm}` +
                    `\nFalse: ${Config.emotes.deny}`
            )
            .setFooter(`This message expires in 2 minutes!`, botUser.avatarURL())
            .setColor(Config.colors.default)
            .setTimestamp();

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
            let requireAllTrustedRolesEmbed = new MessageEmbed()
                .setAuthor(`${guild.name}`, guild.iconURL())
                .setTitle('Trusted Setup - Require All Trusted Roles')
                .setDescription(
                    `With premium you can set multiple trusted roles. Because of this, you can choose if a user needs one or all of the trusted roles to have their birthday celebrated.` +
                        `\n\nShould birthdays require all trusted roles? [(?)](${Config.links.docs}/faq#)` +
                        `\n\nTrue: ${Config.emotes.confirm}` +
                        `\nFalse: ${Config.emotes.deny}`
                )
                .setFooter(`This message expires in 2 minutes!`, botUser.avatarURL())
                .setColor(Config.colors.default)
                .setTimestamp();

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

        let description =
            'You have successfully completed the trusted server setup!' +
            `\n\n**Trusted Prevents Role**: \`${preventRole === 1 ? 'True' : 'False'}\`` +
            `\n**Trusted Prevents Message**: \`${preventMessage === 1 ? 'True' : 'False'}\``;

        description += hasPremium
            ? `\n**Require All Trusted Roles**: \`${preventRole === 1 ? 'True' : 'False'}\``
            : '';

        let embed = new MessageEmbed()
            .setAuthor(`${guild.name}`, guild.iconURL())
            .setTitle('Trusted Setup - Completed')
            .setDescription(description)
            .setFooter(`Trusted Setup Complete!`, botUser.avatarURL())
            .setColor(Config.colors.default)
            .setTimestamp();

        await MessageUtils.send(channel, embed);

        await this.guildRepo.guildSetupTrusted(
            guild.id,
            requireAllTrustedRoles,
            preventMessage,
            preventRole
        );
    }
}
