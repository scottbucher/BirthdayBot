import {
    CollectorFilter,
    Message,
    MessageEmbed,
    MessageReaction,
    Role,
    TextChannel,
    User,
} from 'discord.js';

import { PermissionUtils } from '.';
import { GuildRepo } from '../services/database/repos';
import { ActionUtils } from './action-utils';

let Config = require('../../config/config.json');

export abstract class SetupUtils {
    public static async executeRequiredSetup(
        msg: Message,
        channel: TextChannel,
        guildRepo: GuildRepo
    ): Promise<void> {
        let guild = channel.guild;
        let user = msg.author;
        let botUser = guild.client.user;

        let birthdayChannel: string;
        let birthdayRole: string;

        let channelEmbed = new MessageEmbed()
            .setAuthor(`${guild.name}`, guild.iconURL())
            .setTitle('Server Setup - Birthday Channel')
            .setDescription(
                'To begin you must set up the birthday channel [(?)](https://birthdaybot.scottbucher.dev/faq#why-does-birthday-bot-need-my-timezone)' +
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

        let channelMessage = await channel.send(channelEmbed);
        for (let reactOption of reactOptions) {
            await channelMessage.react(reactOption);
        }

        const filter = (nextReaction: MessageReaction, reactor: User) =>
            reactOptions.includes(nextReaction.emoji.name) &&
            nextReaction.users.resolve(botUser.id) !== null &&
            reactor === user; // Reaction Collector Filter

        let reactionCollectorChannel = channelMessage.createReactionCollector(filter, {
            time: Config.promptExpireTime * 1000,
        });

        reactionCollectorChannel.on(
            'collect',
            async (nextReaction: MessageReaction, reactor: User) => {
                // Start Reaction Collector
                // Check if bot has permission to send a message
                if (!PermissionUtils.canSend(channel)) {
                    reactionCollectorChannel.stop();
                    return;
                }

                ActionUtils.deleteMessage(channelMessage);

                if (nextReaction.emoji.name === Config.emotes.create) {
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
                            ],
                        })
                    )?.id;
                } else if (nextReaction.emoji.name === Config.emotes.select) {
                    let embed = new MessageEmbed()
                        .setDescription(`Please mention a channel or input a channel's name.`)
                        .setColor(Config.colors.default);
                    let selectMessage = await channel.send(embed);

                    const messageFilter: CollectorFilter = (nextMsg: Message): boolean => {
                        if (nextMsg.author !== user) {
                            return false;
                        }

                        let nextMsgArgs = nextMsg?.content.split(' ');

                        if (nextMsgArgs[0]?.toLowerCase() === 'bday') {
                            return false;
                        }

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

                        if (!channelInput || channelInput.guild.id !== guild.id) {
                            let embed = new MessageEmbed()
                                .setDescription('Invalid channel!')
                                .setColor(Config.colors.error);

                            channel.send(embed);
                            return false;
                        }

                        // Bot needs to be able to message in the desired channel
                        if (!PermissionUtils.canSend(channelInput)) {
                            let embed = new MessageEmbed()
                                .setDescription(
                                    `I don't have permission to send messages in ${channelInput.toString()}!`
                                )
                                .setColor(Config.colors.error);
                            channel.send(embed);
                            return false;
                        }

                        return true;
                    };

                    await channel
                        .awaitMessages(messageFilter, {
                            time: Config.promptExpireTime * 1000,
                            max: 1,
                        })
                        .then(async collected => {
                            // Check if bot has permission to send a message
                            if (!PermissionUtils.canSend(channel)) return; // Check if another command was ran, if so cancel the current process

                            let nextMsg = collected.first();

                            // Find mentioned channel
                            let channelInput: TextChannel = nextMsg.mentions.channels.first();

                            // If could not find in mention check, try to find by name
                            if (!channelInput) {
                                channelInput = guild.channels.cache
                                    .filter(channel => channel instanceof TextChannel)
                                    .map(channel => channel as TextChannel)
                                    .find(channel =>
                                        channel.name
                                            .toLowerCase()
                                            .includes(nextMsg?.content.toLowerCase())
                                    );
                            }

                            // Could it find the channel in either check?
                            if (!channelInput || channelInput.guild.id !== guild.id) {
                                let embed = new MessageEmbed()
                                    .setDescription('Invalid channel!')
                                    .setColor(Config.colors.error);
                                await channel.send(embed);
                                birthdayChannel = '0';
                                return;
                            }

                            // Get the id of the channel (send this to the database)
                            birthdayChannel = channelInput?.id;

                            ActionUtils.deleteMessage(selectMessage);
                        });
                } else if (nextReaction.emoji.name === Config.emotes.deny) {
                    birthdayChannel = '0';
                }
                reactionCollectorChannel.stop();

                let roleEmbed = new MessageEmbed()
                    .setAuthor(`${guild.name}`, guild.iconURL())
                    .setTitle('Server Setup - Birthday Role')
                    .setDescription(
                        'Now, set up the birthday role [(?)](https://birthdaybot.scottbucher.dev/faq#what-is-the-birthday-role)' +
                            '\n\nPlease select an option'
                    )
                    .addField(
                        `Create New Role ${Config.emotes.create}\nSelect Pre-Existing Role ${Config.emotes.select}\nNo Birthday Role ${Config.emotes.deny}`,
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

                let reactionCollectorRole = roleMessage.createReactionCollector(filter, {
                    time: Config.promptExpireTime * 1000,
                });

                reactionCollectorRole.on(
                    'collect',
                    async (nextReaction: MessageReaction, reactor: User) => {
                        // Start Reaction Collector
                        // Check if bot has permission to send a message
                        if (!PermissionUtils.canSend(channel)) {
                            reactionCollectorRole.stop();
                            return;
                        }

                        ActionUtils.deleteMessage(roleMessage);

                        if (nextReaction.emoji.name === Config.emotes.create) {
                            // Create role with desired attributes
                            birthdayRole = (
                                await guild.roles.create({
                                    data: {
                                        name: Config.emotes.birthday,
                                        color: `0xac1cfe`,
                                        hoist: true,
                                        mentionable: true,
                                    },
                                })
                            )?.id;
                        } else if (nextReaction.emoji.name === Config.emotes.select) {
                            let embed = new MessageEmbed()
                                .setDescription(`Please mention a role or input a role's name.`)
                                .setColor(Config.colors.default);
                            let selectMessage = await channel.send(embed);

                            const messageFilter: CollectorFilter = (nextMsg: Message): boolean => {
                                if (nextMsg.author !== user) {
                                    return false;
                                }

                                let nextMsgArgs = nextMsg?.content.split(' ');

                                if (nextMsgArgs[0]?.toLowerCase() === 'bday') {
                                    return false;
                                }

                                // Find mentioned role
                                let roleInput: Role = nextMsg.mentions.roles.first();

                                if (!roleInput) {
                                    roleInput = guild.roles.cache.find(role =>
                                        role.name
                                            .toLowerCase()
                                            .includes(nextMsg?.content.toLowerCase())
                                    );
                                }

                                if (
                                    !roleInput ||
                                    roleInput.guild.id !== guild.id ||
                                    nextMsg?.content.toLowerCase() === 'everyone'
                                ) {
                                    let embed = new MessageEmbed()
                                        .setDescription(`Invalid Role!`)
                                        .setColor(Config.colors.error);
                                    channel.send(embed);
                                    return false;
                                }

                                if (
                                    roleInput.position >
                                    guild.members.resolve(botUser).roles.highest.position
                                ) {
                                    let embed = new MessageEmbed()
                                        .setDescription(
                                            `Birthday Role must be bellow the Bot's role!`
                                        )
                                        .setColor(Config.colors.error);
                                    channel.send(embed);
                                    return false;
                                }

                                if (roleInput.managed) {
                                    let embed = new MessageEmbed()
                                        .setDescription(
                                            `Birthday Role cannot be managed by an external service!`
                                        )
                                        .setColor(Config.colors.error);
                                    channel.send(embed);
                                    return false;
                                }
                                return true;
                            };

                            await channel
                                .awaitMessages(messageFilter, {
                                    time: Config.promptExpireTime * 1000,
                                    max: 1,
                                    errors: ['time'],
                                })
                                .then(async collected => {
                                    // Check if bot has permission to send a message
                                    if (!PermissionUtils.canSend(channel)) return;

                                    // Check if another command was ran, if so cancel the current process
                                    let nextMsg = collected.first();

                                    // Find mentioned role
                                    let roleInput: Role = nextMsg.mentions.roles.first();

                                    if (!roleInput) {
                                        roleInput = guild.roles.cache.find(role =>
                                            role.name
                                                .toLowerCase()
                                                .includes(nextMsg?.content.toLowerCase())
                                        );
                                    }

                                    if (
                                        !roleInput ||
                                        roleInput.guild.id !== guild.id ||
                                        nextMsg?.content.toLowerCase() === 'everyone'
                                    ) {
                                        let embed = new MessageEmbed()
                                            .setDescription(`Invalid Role!`)
                                            .setColor(Config.colors.error);
                                        await channel.send(embed);
                                        birthdayRole = '0';
                                        return;
                                    }

                                    // Get the id of the channel (send this to the database)
                                    birthdayRole = roleInput?.id;

                                    ActionUtils.deleteMessage(selectMessage);
                                });
                        } else if (nextReaction.emoji.name === Config.emotes.deny) {
                            birthdayRole = '0';
                        }

                        let channelOutput =
                            birthdayChannel === '0'
                                ? 'Not Set'
                                : guild.channels.resolve(birthdayChannel)?.toString() ||
                                  '**Unknown**';
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

                        await channel.send(embed);

                        await guildRepo.addOrUpdateGuild(guild.id, birthdayChannel, birthdayRole);
                        reactionCollectorRole.stop();
                    }
                );
            }
        );
    }
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    public static async executeMessageSetup(
        msg: Message,
        channel: TextChannel,
        guildRepo: GuildRepo
    ): Promise<void> {
        let guild = channel.guild;
        let user = msg.author;
        let botUser = guild.client.user;

        let messageTime: number;
        let mention: string;
        let useEmbed: number;
        let expired = true;

        let messageTimeEmbed = new MessageEmbed()
            .setAuthor(`${guild.name}`, guild.iconURL())
            .setTitle('Message Setup - Birthday Message Time')
            .setDescription(
                'Please give the hour for your Birthday Messages [(?)](https://birthdaybot.scottbucher.dev/faq#what-is-the-birthday-message-time)' +
                    '\n\nAccepted Values: `0-23`\nDefault Value: `0`' +
                    '\n\n**Example Usage**: `13` (1PM)'
            )
            .setFooter(`This message expires in 2 minutes!`, botUser.avatarURL())
            .setColor(Config.colors.default)
            .setTimestamp();

        await channel.send(messageTimeEmbed);

        let collector = channel.createMessageCollector(
            (nextMsg: Message) => nextMsg.author.id === user.id,
            { time: Config.promptExpireTime * 1000 }
        );

        collector.on('collect', async (nextMsg: Message) => {
            // Check if bot has permission to send a message
            if (!PermissionUtils.canSend(channel)) {
                collector.stop();
                expired = false;
                return;
            }

            // Check if another command was ran, if so cancel the current process
            let nextMsgArgs = nextMsg?.content.split(' ');
            if (nextMsgArgs[0]?.toLowerCase() === 'bday') {
                collector.stop();
                expired = false;
                return;
            }

            if (!messageTime && messageTime !== 0) {
                // Try and get the time
                try {
                    messageTime = parseInt(nextMsgArgs[0]);
                } catch (error) {
                    let embed = new MessageEmbed()
                        .setTitle('Message Setup - Message Time')
                        .setDescription('Invalid time!')
                        .setFooter(`Please check above and try again!`, botUser.avatarURL())
                        .setTimestamp()
                        .setColor(Config.colors.error);
                    await channel.send(embed);
                    messageTime = undefined;
                    return;
                }

                if (messageTime !== 0 && (messageTime < 0 || messageTime > 23 || !messageTime)) {
                    let embed = new MessageEmbed()
                        .setTitle('Message Setup - Message Time')
                        .setDescription('Invalid time!')
                        .setFooter(`Please check above and try again!`, botUser.avatarURL())
                        .setTimestamp()
                        .setColor(Config.colors.error);
                    await channel.send(embed);
                    messageTime = undefined;
                    return;
                }

                collector.resetTimer(); // Reset timer

                let messageMentionEmbed = new MessageEmbed()
                    .setAuthor(`${guild.name}`, guild.iconURL())
                    .setTitle('Message Setup - Birthday Message Mention')
                    .setDescription(
                        'Now you can set your birthday message mention! [(?)](https://birthdaybot.scottbucher.dev/faq#what-is-the-birthday-message-mention)' +
                            '\n\nAcceptable inputs: `everyone`, `here`, `@role/role-name`, or `none`' +
                            '\n\nDefault Value: `none`'
                    )
                    .setFooter(`This message expires in 2 minutes!`, botUser.avatarURL())
                    .setColor(Config.colors.default)
                    .setTimestamp();

                await channel.send(messageMentionEmbed);
                return;
            }

            if (!mention) {
                // Find mentioned role
                let roleInput: Role = nextMsg.mentions.roles.first();

                if (!roleInput) {
                    roleInput = guild.roles.cache.find(role =>
                        role.name.toLowerCase().includes(nextMsg?.content.toLowerCase())
                    );
                }

                if (!roleInput || roleInput.guild.id !== guild.id) {
                    // If there is no roles then check for other accepted values
                    let roleOptions = ['everyone', 'here', '@here', 'none'];
                    if (!roleOptions.includes(nextMsg?.content.toLowerCase())) {
                        let embed = new MessageEmbed()
                            .setTitle('Message Setup - Birthday Message Mention')
                            .setDescription('Could not find the group or role!')
                            .setFooter(`Please check above and try again!`, botUser.avatarURL())
                            .setTimestamp()
                            .setColor(Config.colors.error);
                        await channel.send(embed);
                        return;
                    } else {
                        if (nextMsg?.content.toLowerCase() === '@here') {
                            // Support for the @here input
                            mention = `here`;
                        } else {
                            mention = nextMsg?.content.toLowerCase(); // Else it is either here, everyone, or none
                        }
                    }
                } else {
                    mention = roleInput?.id; // If roleInput does exists then get the role Id
                }

                let embedMessage = new MessageEmbed()
                    .setAuthor(`${guild.name}`, guild.iconURL())
                    .setTitle('Message Setup - Embed Birthday Message')
                    .setDescription(
                        'Now you can choose if the Birthday Message should be embedded or not! [(?)](https://birthdaybot.scottbucher.dev/faq#what-is-an-embed)' +
                            '\n\nDisable this if you use a image/gif in your Custom Birthday Message. [(?)](https://birthdaybot.scottbucher.dev/faq#what-is-the-custom-birthday-message)' +
                            `\n\nEnabled: ${Config.emotes.confirm}` +
                            `\nDisabled: ${Config.emotes.deny}`
                    )
                    .setFooter(`This message expires in 2 minutes!`, botUser.avatarURL())
                    .setColor(Config.colors.default)
                    .setTimestamp();

                expired = false;
                collector.stop();

                let reactOptions = [Config.emotes.confirm, Config.emotes.deny];

                let optionMessage = await channel.send(embedMessage);
                for (let reactOption of reactOptions) {
                    await optionMessage.react(reactOption);
                }

                const filter = (nextReaction: MessageReaction, reactor: User) =>
                    reactOptions.includes(nextReaction.emoji.name) &&
                    nextReaction.users.resolve(channel.client.user.id) !== null &&
                    reactor === user; // Reaction Collector Filter

                let reactionCollector = optionMessage.createReactionCollector(filter, {
                    time: Config.promptExpireTime * 1000,
                });
                let reactionExpired = true;

                reactionCollector.on(
                    'collect',
                    async (nextReaction: MessageReaction, reactor: User) => {
                        // Start Reaction Collector
                        // Check if bot has permission to send a message
                        if (!PermissionUtils.canSend(channel)) {
                            reactionExpired = false;
                            reactionCollector.stop();
                            return;
                        }
                        useEmbed = nextReaction.emoji.name === Config.emotes.confirm ? 1 : 0;
                        reactionExpired = false;
                        reactionCollector.stop();

                        let timeOutput: string;
                        if (messageTime === 0) timeOutput = '12:00 AM';
                        else if (messageTime === 12) timeOutput = '12:00 PM';
                        else if (messageTime < 12) timeOutput = messageTime + ':00 AM';
                        else timeOutput = messageTime - 12 + ':00 PM';

                        let mentionOutput: string;

                        // Find mentioned role
                        let roleInput: Role = guild.roles.resolve(mention);

                        if (!roleInput) {
                            roleInput = guild.roles.cache.find(role =>
                                role.name.toLowerCase().includes(nextMsg?.content.toLowerCase())
                            );
                        }

                        if (!roleInput || roleInput.guild.id !== guild.id) {
                            if (
                                mention.toLowerCase() === 'everyone' ||
                                mention.toLowerCase() === 'here'
                            ) {
                                mentionOutput = '@' + mention;
                            } else if (mention.toLowerCase() === 'none') {
                                mentionOutput = `${mention}`;
                            }
                        } else {
                            mentionOutput = roleInput.toString();
                        }

                        let embed = new MessageEmbed()
                            .setAuthor(`${guild.name}`, guild.iconURL())
                            .setTitle('Message Setup - Completed')
                            .setDescription(
                                'You have successfully completed the server message setup!' +
                                    `\n\n**Birthday Message Time**: \`${timeOutput}\`` +
                                    `\n**Mention Setting**: ${mentionOutput}` +
                                    `\n**Use Embed**: \`${useEmbed === 1 ? 'True' : 'False'}\``
                            )
                            .setFooter(`Message Setup Complete!`, botUser.avatarURL())
                            .setColor(Config.colors.default)
                            .setTimestamp();

                        if (mention === 'none') mention = '0';

                        await guildRepo.guildSetupMessage(guild.id, messageTime, mention, useEmbed);

                        await channel.send(embed);
                    }
                ); // END OF REACTION COLLECTOR
                reactionCollector.on('end', async collected => {
                    // Check if I have permission to send a message
                    if (!PermissionUtils.canSend(channel)) {
                        reactionExpired = false;
                        reactionCollector.stop();
                        return;
                    }

                    if (reactionExpired) {
                        let embed = new MessageEmbed()
                            .setTitle('Message Setup - Expired')
                            .setDescription('Type `bday setup message` to rerun the setup.')
                            .setColor(Config.colors.error);
                        await channel.send(embed);
                    }
                });
            }
        }); // END OF MESSAGE COLLECTOR

        collector.on('end', async collected => {
            // Check if I have permission to send a message
            if (!PermissionUtils.canSend(channel)) {
                expired = false;
                collector.stop();
                return;
            }

            if (expired) {
                let embed = new MessageEmbed()
                    .setTitle('Message Setup - Expired')
                    .setDescription('Type `bday setup message` to rerun the setup.')
                    .setColor(Config.colors.error);
                await channel.send(embed);
            }
        });
    } // END OF METHOD
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    public static async executeTrustedSetup(
        msg: Message,
        channel: TextChannel,
        guildRepo: GuildRepo
    ): Promise<void> {
        let guild = channel.guild;
        let user = msg.author;
        let botUser = guild.client.user;

        let preventMessage: number;
        let preventRole: number;
        let trustedRole;

        let preventMessageEmbed = new MessageEmbed()
            .setAuthor(`${guild.name}`, guild.iconURL())
            .setTitle('Trusted Setup - Trusted Prevents Message')
            .setDescription(
                'Should the trusted role prevent the birthday message? [(?)](https://birthdaybot.scottbucher.dev/faq#what-is-the-trusted-prevents-message-role)' +
                    `\n\nTrue: ${Config.emotes.confirm}` +
                    `\nFalse: ${Config.emotes.deny}`
            )
            .setFooter(`This message expires in 2 minutes!`, botUser.avatarURL())
            .setColor(Config.colors.default)
            .setTimestamp();

        let reactOptions = [Config.emotes.confirm, Config.emotes.deny];

        let settingMessage = await channel.send(preventMessageEmbed); // Send confirmation and emotes
        for (let reactOption of reactOptions) {
            await settingMessage.react(reactOption);
        }

        const filter = (nextReaction: MessageReaction, reactor: User) =>
            reactOptions.includes(nextReaction.emoji.name) &&
            nextReaction.users.resolve(botUser.id) !== null &&
            reactor === user; // Reaction Collector Filter

        let reactionCollectorMessage = settingMessage.createReactionCollector(filter, {
            time: Config.promptExpireTime * 1000,
        });

        reactionCollectorMessage.on(
            'collect',
            async (nextReaction: MessageReaction, reactor: User) => {
                // Start Reaction Collector
                // Check if bot has permission to send a message
                if (!PermissionUtils.canSend(channel)) {
                    reactionCollectorMessage.stop();
                    return;
                }

                await ActionUtils.deleteMessage(settingMessage); // Try and delete the message

                if (nextReaction.emoji.name === Config.emotes.confirm) {
                    // True
                    preventMessage = 1;
                } else if (nextReaction.emoji.name === Config.emotes.deny) {
                    // False
                    preventMessage = 0;
                }

                reactionCollectorMessage.stop();

                let preventRoleEmbed = new MessageEmbed()
                    .setAuthor(`${guild.name}`, guild.iconURL())
                    .setTitle('Trusted Setup - Trusted Prevents Role')
                    .setDescription(
                        'Should the trusted role prevent the birthday role? [(?)](https://birthdaybot.scottbucher.dev/faq#what-is-the-trusted-prevents-message-role)' +
                            `\n\nTrue: ${Config.emotes.confirm}` +
                            `\nFalse: ${Config.emotes.deny}`
                    )
                    .setFooter(`This message expires in 2 minutes!`, botUser.avatarURL())
                    .setColor(Config.colors.default)
                    .setTimestamp();

                let reactOptions = [Config.emotes.confirm, Config.emotes.deny];

                let settingRoleMessage = await channel.send(preventRoleEmbed); // Send confirmation and emotes
                for (let reactOption of reactOptions) {
                    await settingRoleMessage.react(reactOption);
                }

                let reactionCollector = settingRoleMessage.createReactionCollector(filter, {
                    time: Config.promptExpireTime * 1000,
                });

                reactionCollector.on(
                    'collect',
                    async (nextReaction: MessageReaction, reactor: User) => {
                        // Start Reaction Collector
                        // Check if bot has permission to send a message
                        if (!PermissionUtils.canSend(channel)) {
                            reactionCollector.stop();
                            return;
                        }

                        await ActionUtils.deleteMessage(settingRoleMessage); // Try and delete the message

                        if (nextReaction.emoji.name === Config.emotes.confirm) {
                            // True
                            preventRole = 1;
                            reactionCollector.stop();
                        } else if (nextReaction.emoji.name === Config.emotes.deny) {
                            // False
                            preventRole = 0;
                            reactionCollector.stop();
                        }

                        // Create/Select/No Trusted Role

                        let channelEmbed = new MessageEmbed()
                            .setAuthor(`${guild.name}`, guild.iconURL())
                            .setTitle('Trusted Setup - Trusted Role')
                            .setDescription(
                                'To begin you must select the Trusted Role [(?)](https://birthdaybot.scottbucher.dev/faq#do-i-need-to-set-up-the-trusted-role)' +
                                    '\n\nPlease select an option'
                            )
                            .addField(
                                `Create New Role ${Config.emotes.create}\nSelect Pre-Existing Role ${Config.emotes.select}\nNo Trusted Role ${Config.emotes.deny}`,
                                '\u200b'
                            )
                            .setFooter(`This message expires in 2 minutes!`, botUser.avatarURL())
                            .setColor(Config.colors.default)
                            .setTimestamp();

                        let reactOptions = [
                            Config.emotes.create,
                            Config.emotes.select,
                            Config.emotes.deny,
                        ];

                        let trustedMessage = await channel.send(channelEmbed);
                        for (let reactOption of reactOptions) {
                            await trustedMessage.react(reactOption);
                        }

                        const messageFilter = (nextReaction: MessageReaction, reactor: User) =>
                            reactOptions.includes(nextReaction.emoji.name) &&
                            nextReaction.users.resolve(botUser.id) !== null &&
                            reactor === user; // Reaction Collector Filter

                        let reactionCollectorRole = trustedMessage.createReactionCollector(
                            messageFilter,
                            {
                                time: Config.promptExpireTime * 1000,
                            }
                        );

                        reactionCollectorRole.on(
                            'collect',
                            async (nextReaction: MessageReaction, reactor: User) => {
                                // Start Reaction Collector
                                // Check if bot has permission to send a message
                                if (!PermissionUtils.canSend(channel)) {
                                    reactionCollectorRole.stop();
                                    return;
                                }

                                if (nextReaction.emoji.name === Config.emotes.create) {
                                    // Create role with desired attributes
                                    trustedRole = (
                                        await guild.roles.create({
                                            data: {
                                                name: 'BirthdayTrusted',
                                            },
                                        })
                                    )?.id;
                                } else if (nextReaction.emoji.name === Config.emotes.select) {
                                    let embed = new MessageEmbed()
                                        .setDescription(
                                            `Please mention a role or input a role's name.`
                                        )
                                        .setColor(Config.colors.default);
                                    let selectMessage = await channel.send(embed);

                                    const messageFilter: CollectorFilter = (
                                        nextMsg: Message
                                    ): boolean => {
                                        if (nextMsg.author !== user) {
                                            return false;
                                        }

                                        // Find mentioned role
                                        let roleInput: Role = nextMsg.mentions.roles.first();

                                        if (!roleInput) {
                                            roleInput = guild.roles.cache.find(role =>
                                                role.name
                                                    .toLowerCase()
                                                    .includes(nextMsg?.content.toLowerCase())
                                            );
                                        }

                                        if (
                                            !roleInput ||
                                            roleInput.guild.id !== guild.id ||
                                            nextMsg?.content.toLowerCase() === 'everyone'
                                        ) {
                                            let embed = new MessageEmbed()
                                                .setDescription(`Invalid Role!`)
                                                .setColor(Config.colors.error);
                                            channel.send(embed);
                                            return false;
                                        }
                                        return true;
                                    };

                                    await channel
                                        .awaitMessages(messageFilter, {
                                            time: Config.promptExpireTime * 1000,
                                            max: 1,
                                            errors: ['time'],
                                        })
                                        .then(async collected => {
                                            // Check if bot has permission to send a message
                                            if (!PermissionUtils.canSend(channel)) return;

                                            // Check if another command was ran, if so cancel the current process
                                            let nextMsg = collected.first();
                                            let nextMsgArgs = nextMsg?.content.split(' ');

                                            if (nextMsgArgs[0]?.toLowerCase() === 'bday') return;

                                            // Find mentioned role
                                            let roleInput: Role = nextMsg.mentions.roles.first();

                                            if (!roleInput) {
                                                roleInput = guild.roles.cache.find(role =>
                                                    role.name
                                                        .toLowerCase()
                                                        .includes(nextMsg?.content.toLowerCase())
                                                );
                                            }

                                            if (
                                                !roleInput ||
                                                roleInput.guild.id !== guild.id ||
                                                nextMsg?.content.toLowerCase() === 'everyone'
                                            ) {
                                                let embed = new MessageEmbed()
                                                    .setDescription(`Invalid Role!`)
                                                    .setColor(Config.colors.error);
                                                await channel.send(embed);
                                                trustedRole = '0';
                                                return;
                                            }

                                            // Get the id of the channel (send this to the database)
                                            trustedRole = roleInput?.id;
                                            ActionUtils.deleteMessage(selectMessage);
                                        });
                                } else if (nextReaction.emoji.name === Config.emotes.deny) {
                                    trustedRole = '0';
                                }

                                ActionUtils.deleteMessage(trustedMessage);
                                reactionCollectorRole.stop();

                                let roleOutput =
                                    trustedRole === '0'
                                        ? 'Not Set'
                                        : guild.roles.resolve(trustedRole)?.toString() ||
                                          '**Unknown**';

                                let embed = new MessageEmbed()
                                    .setAuthor(`${guild.name}`, guild.iconURL())
                                    .setTitle('Trusted Setup - Completed')
                                    .setDescription(
                                        'You have successfully completed the trusted server setup!' +
                                            `\n\n**Trusted Role**: ${roleOutput}` +
                                            `\n**Trusted Prevents Role**: \`${
                                                preventRole === 1 ? 'True' : 'False'
                                            }\`` +
                                            `\n**Trusted Prevents Message**: \`${
                                                preventMessage === 1 ? 'True' : 'False'
                                            }\``
                                    )
                                    .setFooter(`Trusted Setup Complete!`, botUser.avatarURL())
                                    .setColor(Config.colors.default)
                                    .setTimestamp();

                                await channel.send(embed);

                                await guildRepo.guildSetupTrusted(
                                    guild.id,
                                    trustedRole,
                                    preventMessage,
                                    preventRole
                                );
                                reactionCollectorRole.stop();
                            }
                        );
                    }
                );
            }
        );
    }
}
