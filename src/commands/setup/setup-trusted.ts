import { ActionUtils, MessageUtils } from '../../utils';
import {
    CollectOptions,
    CollectorUtils,
    ExpireFunction,
    MessageFilter,
} from 'discord.js-collector-utils';
import { Message, MessageEmbed, MessageReaction, Role, TextChannel, User } from 'discord.js';

import { GuildRepo } from '../../services/database/repos';

let Config = require('../../../config/config.json');

const COLLECT_OPTIONS: CollectOptions = {
    time: Config.experience.promptExpireTime * 1000,
    reset: true,
};

export class SetupTrusted {
    constructor(private guildRepo: GuildRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel) {
        let guild = channel.guild;
        let botUser = guild.client.user;
        let stopFilter: MessageFilter = (nextMsg: Message) =>
            nextMsg.author.id === msg.author.id &&
                [Config.prefix, ...Config.stopCommands].includes(nextMsg.content.split(/\s+/)[0].toLowerCase());
        let expireFunction: ExpireFunction = async () => {
            await channel.send(
                new MessageEmbed()
                    .setTitle('Trusted Setup - Expired')
                    .setDescription('Type `bday setup trusted` to rerun the setup.')
                    .setColor(Config.colors.error)
            );
        };

        let trustedRole: string;
        let preventMessage: number;
        let preventRole: number;

        // Create/Select/No Trusted Role

        let roleEmbed = new MessageEmbed()
            .setAuthor(`${guild.name}`, guild.iconURL())
            .setTitle('Trusted Setup - Trusted Role')
            .setDescription(
                `For help, view the trusted setup guide [here](${Config.links.docs}/server-setup/trusted-setup)!` +
                    `\n\nTo begin you must select the Trusted Role [(?)](${Config.links.docs}/faq#do-i-need-to-set-up-the-trusted-role)` +
                    '\n\nPlease select an option'
            )
            .addField(
                `Create New Role ${Config.emotes.create}\nSelect Pre-Existing Role ${Config.emotes.select}\nNo Trusted Role ${Config.emotes.deny}`,
                '\u200b'
            )
            .setFooter(`This message expires in 2 minutes!`, botUser.avatarURL())
            .setColor(Config.colors.default)
            .setTimestamp();

        let reactOptions = [Config.emotes.create, Config.emotes.select, Config.emotes.deny];

        let roleMessage = await channel.send(roleEmbed);
        for (let reactOption of reactOptions) {
            await roleMessage.react(reactOption);
        }

        let roleOptions: string = await CollectorUtils.collectByReaction(
            roleMessage,
            // Collect Filter
            (msgReaction: MessageReaction, reactor: User) =>
                reactor.id === msg.author.id && reactOptions.includes(msgReaction.emoji.name),
            stopFilter,
            // Retrieve Result
            async (msgReaction: MessageReaction, reactor: User) => {
                return msgReaction.emoji.name;
            },
            expireFunction,
            COLLECT_OPTIONS
        );

        ActionUtils.deleteMessage(roleMessage);

        if (roleOptions === undefined) return;

        switch (roleOptions) {
            case Config.emotes.create: {
                // Create role with desired attributes
                trustedRole = (
                    await guild.roles.create({
                        data: {
                            name: 'BirthdayTrusted',
                        },
                    })
                )?.id;
                break;
            }
            case Config.emotes.select: {
                let embed = new MessageEmbed()
                    .setDescription(`Please mention a role or input a role's name.`)
                    .setColor(Config.colors.default);
                let selectMessage = await MessageUtils.send(channel, embed);

                trustedRole = await CollectorUtils.collectByMessage(
                    msg.channel,
                    // Collect Filter
                    (nextMsg: Message) => nextMsg.author.id === msg.author.id,
                    // Stop Filter
                    stopFilter,
                    // Retrieve Result
                    async (nextMsg: Message) => {
                        // Find mentioned role
                        let roleInput: Role = nextMsg.mentions.roles.first();

                        // Search guild for role
                        if (!roleInput) {
                            roleInput = guild.roles.cache.find(role =>
                                role.name.toLowerCase().includes(nextMsg?.content.toLowerCase())
                            );
                        }

                        // If it couldn't find the role, the role was in another guild, or the role the everyone role
                        if (
                            !roleInput ||
                            roleInput.id === guild.id ||
                            nextMsg?.content.toLowerCase() === 'everyone'
                        ) {
                            let embed = new MessageEmbed()
                                .setDescription(`Invalid role!`)
                                .setFooter('Please try again.')
                                .setColor(Config.colors.error);
                            MessageUtils.send(channel, embed);
                            return;
                        }
                        return roleInput?.id;
                    },
                    expireFunction,
                    COLLECT_OPTIONS
                );

                ActionUtils.deleteMessage(selectMessage);

                if (trustedRole === undefined) {
                    return;
                }
                break;
            }
            case Config.emotes.deny: {
                trustedRole = '0';
                break;
            }
        }

        let preventMessageEmbed = new MessageEmbed()
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

        let settingMessage = await channel.send(preventMessageEmbed); // Send confirmation and emotes
        for (let option of trueFalseOptions) {
            await settingMessage.react(option);
        }

        let messageOption: string = await CollectorUtils.collectByReaction(
            settingMessage,
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

        ActionUtils.deleteMessage(settingMessage);

        if (roleOptions === undefined) return;

        preventMessage = messageOption === Config.emotes.confirm ? 1 : 0;

        let preventRoleEmbed = new MessageEmbed()
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

        let settingRole = await channel.send(preventRoleEmbed); // Send confirmation and emotes
        for (let option of trueFalseOptions) {
            await settingRole.react(option);
        }

        let roleSettingOptions: string = await CollectorUtils.collectByReaction(
            settingRole,
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

        ActionUtils.deleteMessage(settingRole);

        if (roleOptions === undefined) return;

        preventRole = roleSettingOptions === Config.emotes.confirm ? 1 : 0;

        let roleOutput =
            trustedRole === '0'
                ? 'Not Set'
                : guild.roles.resolve(trustedRole)?.toString() || '**Unknown**';

        let embed = new MessageEmbed()
            .setAuthor(`${guild.name}`, guild.iconURL())
            .setTitle('Trusted Setup - Completed')
            .setDescription(
                'You have successfully completed the trusted server setup!' +
                    `\n\n**Trusted Role**: ${roleOutput}` +
                    `\n**Trusted Prevents Role**: \`${preventRole === 1 ? 'True' : 'False'}\`` +
                    `\n**Trusted Prevents Message**: \`${preventMessage === 1 ? 'True' : 'False'}\``
            )
            .setFooter(`Trusted Setup Complete!`, botUser.avatarURL())
            .setColor(Config.colors.default)
            .setTimestamp();

        await MessageUtils.send(channel, embed);

        await this.guildRepo.guildSetupTrusted(guild.id, trustedRole, preventMessage, preventRole);
    }
}
