import {
    CollectOptions,
    CollectorUtils,
    ExpireFunction,
    MessageFilter,
} from 'discord.js-collector-utils';
import { InvalidUtils, MessageUtils, PermissionUtils } from '../../utils';
import { Message, MessageEmbed, MessageReaction, Role, TextChannel, User } from 'discord.js';

import { GuildRepo } from '../../services/database/repos';

let Config = require('../../../config/config.json');

const COLLECT_OPTIONS: CollectOptions = {
    time: Config.experience.promptExpireTime * 1000,
    reset: true,
};

export class SetupAnniversary {
    constructor(private guildRepo: GuildRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel): Promise<void> {
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
                    .setTitle('Anniversary Setup - Expired')
                    .setDescription('Type `bday setup anniversary` to rerun this setup.')
                    .setColor(Config.colors.error)
            );
        };

        let memberAnniversaryChannel: string;
        let serverAnniversaryChannel: string;

        // Member Anniversary Channel Setup

        let memberAnniversaryChannelEmbed = new MessageEmbed()
            .setAuthor(`${guild.name}`, guild.iconURL())
            .setTitle('Anniversary Setup - Member Anniversary Channel')
            .setDescription(
                `For help, view the anniversary setup guide [here](${Config.links.docs}/)!` +
                    `\n\nTo begin you must set up the member anniversary channel [(?)](${Config.links.docs}/faq#why-does-birthday-bot-need-my-timezone)` +
                    '\n\nPlease select an option'
            )
            .addField(
                `Create New Channel ${Config.emotes.create}\nSelect Pre-Existing Channel ${Config.emotes.select}\nNo Member Anniversary Channel ${Config.emotes.deny}`,
                '\u200b'
            )
            .setFooter(`This message expires in 2 minutes!`, botUser.avatarURL())
            .setColor(Config.colors.default)
            .setTimestamp();

        let reactOptions = [Config.emotes.create, Config.emotes.select, Config.emotes.deny];

        let memberAnniversaryChannelMessage = await MessageUtils.send(
            channel,
            memberAnniversaryChannelEmbed
        );
        for (let reactOption of reactOptions) {
            await MessageUtils.react(memberAnniversaryChannelMessage, reactOption);
        }

        let memberAnniversaryChannelOption: string = await CollectorUtils.collectByReaction(
            memberAnniversaryChannelMessage,
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

        await MessageUtils.delete(memberAnniversaryChannelMessage);

        if (memberAnniversaryChannelOption === undefined) return;

        switch (memberAnniversaryChannelOption) {
            case Config.emotes.create: {
                // Create channel with desired attributes
                memberAnniversaryChannel = (
                    await guild.channels.create(`${Config.emotes.party} member anniversaries`, {
                        type: 'text',
                        topic: 'Member Anniversary Announcements!',
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

                memberAnniversaryChannel = await CollectorUtils.collectByMessage(
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

                if (memberAnniversaryChannel === undefined) {
                    return;
                }
                break;
            }
            case Config.emotes.deny: {
                memberAnniversaryChannel = '0';
                break;
            }
        }

        // Sever Anniversary Channel Setup

        let serverAnniversaryChannelEmbed = new MessageEmbed()
            .setAuthor(`${guild.name}`, guild.iconURL())
            .setTitle('Anniversary Setup - Server Anniversary Channel')
            .setDescription(
                `For help, view the anniversary setup guide [here](${Config.links.docs}/)!` +
                    `\n\nFinally, you must setup the member anniversary channel [(?)](${Config.links.docs}/faq#why-does-birthday-bot-need-my-timezone)` +
                    '\n\nPlease select an option'
            )
            .addField(
                `Create New Channel ${Config.emotes.create}\nSelect Pre-Existing Channel ${Config.emotes.select}\nNo Server Anniversary Channel ${Config.emotes.deny}`,
                '\u200b'
            )
            .setFooter(`This message expires in 2 minutes!`, botUser.avatarURL())
            .setColor(Config.colors.default)
            .setTimestamp();

        let serverAnniversaryChannelMessage = await MessageUtils.send(
            channel,
            serverAnniversaryChannelEmbed
        );
        for (let reactOption of reactOptions) {
            await MessageUtils.react(serverAnniversaryChannelMessage, reactOption);
        }

        let serverAnniversaryChannelOption: string = await CollectorUtils.collectByReaction(
            serverAnniversaryChannelMessage,
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

        await MessageUtils.delete(serverAnniversaryChannelMessage);

        if (serverAnniversaryChannelOption === undefined) return;

        switch (serverAnniversaryChannelOption) {
            case Config.emotes.create: {
                // Create channel with desired attributes
                serverAnniversaryChannel = (
                    await guild.channels.create(`${Config.emotes.party} server anniversaries`, {
                        type: 'text',
                        topic: 'Server Anniversary Announcements!',
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

                serverAnniversaryChannel = await CollectorUtils.collectByMessage(
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

                if (serverAnniversaryChannel === undefined) {
                    return;
                }
                break;
            }
            case Config.emotes.deny: {
                serverAnniversaryChannel = '0';
                break;
            }
        }

        // Output

        let memberAnniversaryChannelOutput =
            memberAnniversaryChannel === '0'
                ? 'Not Set'
                : guild.channels.resolve(memberAnniversaryChannel)?.toString() || '**Unknown**';
        let serverAnniversaryChannelOutput =
            serverAnniversaryChannel === '0'
                ? 'Not Set'
                : guild.channels.resolve(serverAnniversaryChannel)?.toString() || '**Unknown**';

        let embed = new MessageEmbed()
            .setAuthor(`${guild.name}`, guild.iconURL())
            .setTitle('Server Setup - Completed')
            .setDescription(
                'You have successfully completed the required server setup!' +
                    `\n\n**Member Anniversary Channel**: ${memberAnniversaryChannelOutput}` +
                    `\n**Server Anniversary Channel**: ${serverAnniversaryChannelOutput}`
            )
            .setFooter(`All server commands unlocked!`, botUser.avatarURL())
            .setColor(Config.colors.default)
            .setTimestamp();

        await MessageUtils.send(channel, embed);

        await this.guildRepo.guildSetupAnniversary(
            guild.id,
            memberAnniversaryChannel,
            serverAnniversaryChannel
        );
    }
}
