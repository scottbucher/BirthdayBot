import { InvalidUtils, MessageUtils, PermissionUtils } from '../../utils';
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

export class SetupRequired {
    constructor(private guildRepo: GuildRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel) {
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
                    .setTitle('Required Setup - Expired')
                    .setDescription('Type `bday setup` to rerun the setup.')
                    .setColor(Config.colors.error)
            );
        };

        let birthdayChannel: string;
        let birthdayRole: string;

        let channelEmbed = new MessageEmbed()
            .setAuthor(`${guild.name}`, guild.iconURL())
            .setTitle('Server Setup - Birthday Channel')
            .setDescription(
                `For help, view the required setup guide [here](${Config.links.docs}/server-setup/required-setup)!` +
                    `\n\nTo begin you must set up the birthday channel [(?)](${Config.links.docs}/faq#why-does-birthday-bot-need-my-timezone)` +
                    '\n\nPlease select an option'
            )
            .addField(
                `Create New Channel ${Config.emotes.create}\nSelect Pre-Existing Channel ${Config.emotes.select}\nNo Birthday Channel ${Config.emotes.deny}`,
                '\u200b'
            )
            .setFooter(`This message expires in 2 minutes!`, botUser.avatarURL())
            .setColor(Config.colors.default)
            .setTimestamp();

        let reactOptions = [Config.emotes.create, Config.emotes.select, Config.emotes.deny];

        let channelMessage = await MessageUtils.send(channel, channelEmbed);
        for (let reactOption of reactOptions) {
            await MessageUtils.react(channelMessage, reactOption);
        }

        let channelOption: string = await CollectorUtils.collectByReaction(
            channelMessage,
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

        MessageUtils.delete(channelMessage);

        if (channelOption === undefined) return;

        switch (channelOption) {
            case Config.emotes.create: {
                // Create channel with desired attributes
                birthdayChannel = (
                    await guild.channels.create(`${Config.emotes.birthday} birthdays`, {
                        type: 'text',
                        topic: 'Birthday Announcements!',
                        permissionOverwrites: [
                            {
                                id: guild.id,
                                deny: ['SEND_MESSAGES'],
                                allow: ['VIEW_CHANNEL'],
                            },
                            {
                                id: guild.me.roles.cache.filter(role => role.managed).first(),
                                allow: ['VIEW_CHANNEL', 'SEND_MESSAGES'],
                            },
                        ],
                    })
                )?.id;
                break;
            }
            case Config.emotes.select: {
                let embed = new MessageEmbed()
                    .setDescription(`Please mention a channel or input a channel's name.`)
                    .setColor(Config.colors.default);
                let selectMessage = await MessageUtils.send(channel, embed);

                birthdayChannel = await CollectorUtils.collectByMessage(
                    msg.channel,
                    // Collect Filter
                    (nextMsg: Message) => nextMsg.author.id === msg.author.id,
                    stopFilter,
                    // Retrieve Result
                    async (nextMsg: Message) => {
                        // Find mentioned channel
                        let channelInput: TextChannel = nextMsg.mentions.channels.first();

                        if (!channelInput) {
                            channelInput = guild.channels.cache
                                .filter(channel => channel instanceof TextChannel)
                                .map(channel => channel as TextChannel)
                                .find(channel =>
                                    channel.name
                                        .toLowerCase()
                                        .includes(nextMsg.content.toLowerCase())
                                );
                        }

                        if (!channelInput) {
                            let embed = new MessageEmbed()
                                .setDescription('Invalid channel!')
                                .setFooter('Please try again.')
                                .setColor(Config.colors.error);

                            MessageUtils.send(channel, embed);
                            return;
                        }

                        // Bot needs to be able to message in the desired channel
                        if (!PermissionUtils.canSend(channelInput)) {
                            let embed = new MessageEmbed()
                                .setDescription(
                                    `I don't have permission to send messages in ${channelInput.toString()}!`
                                )
                                .setColor(Config.colors.error);
                            MessageUtils.send(channel, embed);
                            return;
                        }
                        return channelInput?.id;
                    },
                    expireFunction,
                    COLLECT_OPTIONS
                );

                MessageUtils.delete(selectMessage);

                if (birthdayChannel === undefined) {
                    return;
                }
                break;
            }
            case Config.emotes.deny: {
                birthdayChannel = '0';
                break;
            }
        }

        let roleEmbed = new MessageEmbed()
            .setAuthor(`${guild.name}`, guild.iconURL())
            .setTitle('Server Setup - Birthday Role')
            .setDescription(
                `Now, set up the birthday role [(?)](${Config.links.docs}/faq#what-is-the-birthday-role)` +
                    `\nNote: The Birthday Role is actively removed from those whose birthday it isn't. [(?)](${Config.links.docs}/faq#what-does-it-mean-by-the-birthday-role-is-actively-removed)` +
                    '\n\nPlease select an option'
            )
            .addField(
                `Create New Role ${Config.emotes.create}\nSelect Pre-Existing Role ${Config.emotes.select}\nNo Birthday Role ${Config.emotes.deny}`,
                '\u200b'
            )
            .setFooter(`This message expires in 2 minutes!`, botUser.avatarURL())
            .setColor(Config.colors.default)
            .setTimestamp();

        let roleMessage = await MessageUtils.send(channel, roleEmbed);
        for (let reactOption of reactOptions) {
            await MessageUtils.react(roleMessage, reactOption);
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

        MessageUtils.delete(roleMessage);

        if (roleOptions === undefined) return;

        switch (roleOptions) {
            case Config.emotes.create: {
                // Create role with desired attributes
                birthdayRole = (
                    await guild.roles.create({
                        data: {
                            name: Config.emotes.birthday,
                            color: Config.colors.role,
                            hoist: true,
                            mentionable: true,
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

                birthdayRole = await CollectorUtils.collectByMessage(
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

                        // Check the role's position
                        if (
                            roleInput.position >
                            guild.members.resolve(botUser).roles.highest.position
                        ) {
                            InvalidUtils.roleHierarchyError(msg.channel as TextChannel, roleInput);
                            return;
                        }

                        // Check if the role is managed
                        if (roleInput.managed) {
                            let embed = new MessageEmbed()
                                .setDescription(
                                    `Birthday Role cannot be managed by an external service!`
                                )
                                .setColor(Config.colors.error);
                            MessageUtils.send(channel, embed);
                            return;
                        }

                        let membersWithRole = roleInput.members.size;

                        if (membersWithRole > 0 && membersWithRole < 100) {
                            let embed = new MessageEmbed()
                                .setTitle('Warning')
                                .setDescription(
                                    `We have detected that __**${membersWithRole}**__ user${
                                        membersWithRole > 1 ? 's' : ''
                                    } already have that role!\nThe Birthday Role should ONLY be the role that users GET on their birthday!`
                                )
                                .setFooter(
                                    `The Bot removes the Birthday Role from anyone whose birthday it isn't!`,
                                    msg.client.user.avatarURL()
                                )
                                .setColor(Config.colors.warning);
                            MessageUtils.send(channel, embed);
                        } else if (membersWithRole > 100) {
                            let embed = new MessageEmbed()
                                .setTitle('Error')
                                .setDescription(
                                    `We have detected that __**${membersWithRole}**__ users already have that role!\nThe Birthday Role should ONLY be the role that users GET on their birthday!`
                                )
                                .setFooter(
                                    `The Bot removes the Birthday Role from anyone whose birthday it isn't!`,
                                    msg.client.user.avatarURL()
                                )
                                .setColor(Config.colors.error);
                            MessageUtils.send(channel, embed);
                            return;
                        }

                        return roleInput?.id;
                    },
                    expireFunction,
                    COLLECT_OPTIONS
                );

                MessageUtils.delete(selectMessage);

                if (birthdayRole === undefined) {
                    return;
                }
                break;
            }
            case Config.emotes.deny: {
                birthdayRole = '0';
                break;
            }
        }

        let channelOutput =
            birthdayChannel === '0'
                ? 'Not Set'
                : guild.channels.resolve(birthdayChannel)?.toString() || '**Unknown**';
        let roleOutput =
            birthdayRole === '0'
                ? 'Not Set'
                : guild.roles.resolve(birthdayRole)?.toString() || '**Unknown**';

        let embed = new MessageEmbed()
            .setAuthor(`${guild.name}`, guild.iconURL())
            .setTitle('Server Setup - Completed')
            .setDescription(
                'You have successfully completed the required server setup!' +
                    `\n\n**Birthday Channel**: ${channelOutput}` +
                    `\n**Birthday Role**: ${roleOutput}`
            )
            .setFooter(`All server commands unlocked!`, botUser.avatarURL())
            .setColor(Config.colors.default)
            .setTimestamp();

        await MessageUtils.send(channel, embed);

        await this.guildRepo.addOrUpdateGuild(guild.id, birthdayChannel, birthdayRole);
    }
}
