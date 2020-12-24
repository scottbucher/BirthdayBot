import {
    CollectOptions,
    CollectorUtils,
    ExpireFunction,
    MessageFilter,
} from 'discord.js-collector-utils';
import { Message, MessageEmbed, MessageReaction, TextChannel, User } from 'discord.js';

import { CustomMessageRepo } from '../../services/database/repos';
import { MessageUtils } from '../../utils';

let Config = require('../../../config/config.json');

const COLLECT_OPTIONS: CollectOptions = {
    time: Config.experience.promptExpireTime * 1000,
    reset: true,
};

export class MessageAddSubCommand {
    constructor(private customMessageRepo: CustomMessageRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel, hasPremium: boolean) {
        let stopFilter: MessageFilter = (nextMsg: Message) =>
            nextMsg.author.id === msg.author.id &&
            [Config.prefix, ...Config.stopCommands].includes(
                nextMsg.content.split(/\s+/)[0].toLowerCase()
            );
        let expireFunction: ExpireFunction = async () => {
            await MessageUtils.send(
                channel,
                new MessageEmbed()
                    .setTitle('Birthday Message Add - Expired')
                    .setDescription(
                        'Type `bday message add <Message>` to add a custom birthday message.'
                    )
                    .setColor(Config.colors.error)
            );
        };

        let type = args[3]?.toLowerCase();

        if (
            !type ||
            (type !== 'birthday' && type !== 'memberanniversary' && type !== 'serveranniversary')
        ) {
            let embed = new MessageEmbed()
                .setTitle('Add Custom Message')
                .setDescription(
                    `Please specify a message type! Accepted Values: \`birthday\`, \`memberAnniversary\`, \`serverAnniversary\``
                )
                .setFooter(`${Config.emotes.deny} Action Failed.`, msg.client.user.avatarURL())
                .setColor(Config.colors.error);
            await MessageUtils.send(channel, embed);
            return;
        }

        if (args.length < 5) {
            let embed = new MessageEmbed()
                .setDescription('Please provide a message!')
                .setColor(Config.colors.error);
            await MessageUtils.send(channel, embed);
            return;
        }

        if (type === 'birthday') {
            // It is a birthday message

            // Variable that decides if we should overwrite an already set user message (default true as not all messages are user messages)
            let overwrite = true;

            // Try and find someone they are mentioning
            let target = msg.mentions.members.first()?.user;

            // Did we find a user?
            if (target) {
                if (target.bot) {
                    let embed = new MessageEmbed()
                        .setTitle('Invalid Usage!')
                        .setDescription('You cannot set a user-specific message for a bot!')
                        .setColor(Config.colors.error);
                    await MessageUtils.send(channel, embed);
                    return;
                } else if (!hasPremium) {
                    let embed = new MessageEmbed()
                        .setTitle('Premium Required!')
                        .setDescription(
                            'User-specific birthday messages are a premium feature! View information about **Birthday Bot Premium** using `bday premium`!'
                        )
                        .setFooter(
                            'Premium helps us support and maintain the bot!',
                            msg.client.user.avatarURL()
                        )
                        .setTimestamp()
                        .setColor(Config.colors.default);
                    await MessageUtils.send(channel, embed);
                    return;
                }
            }

            // Get Message
            let birthdayMessage: string;

            // Compile the birthday message
            if (target) {
                // If the input of the target WASN'T a @mention, replace it with the <@USER_ID> format so the substring works universally
                birthdayMessage = msg.content
                    .replace(args[4], target.toString() + ' ')
                    .substring(msg.content.indexOf(type) + type.length + 23)
                    .replace(/@users?|<users?>|{users?}/gi, '<Users>');
            } else {
                // Basic non user-specific custom message
                birthdayMessage = msg.content
                    .substring(msg.content.indexOf(type) + +type.length + 1)
                    .replace(/@users?|<users?>|{users?}/gi, '<Users>');
            }

            if (birthdayMessage.length > Config.validation.message.maxLength) {
                let embed = new MessageEmbed()
                    .setDescription(
                        `Custom Messages are maxed at ${Config.validation.message.maxLength.toLocaleString()} characters!`
                    )
                    .setColor(Config.colors.error);
                await MessageUtils.send(channel, embed);
                return;
            }

            if (!birthdayMessage.includes('<Users>')) {
                let embed = new MessageEmbed()
                    .setDescription(
                        '' +
                            'Please include the `<Users>` placeholder somewhere in the message. This indicates where birthday usernames will appear.' +
                            '\n' +
                            '\nEx: `bday message add birthday Happy Birthday <Users>!`'
                    )
                    .setColor(Config.colors.error);
                await MessageUtils.send(channel, embed);
                return;
            }

            let customMessages = await this.customMessageRepo.getCustomMessages(msg.guild.id, type);

            let birthdayMessages = customMessages.customMessages.filter(
                message => message.Type === 'birthday'
            );

            let globalMessageCount = birthdayMessages.filter(
                message => message.UserDiscordId === '0'
            ).length;

            if (customMessages) {
                if (
                    globalMessageCount >= Config.validation.message.maxCount.birthday.free &&
                    !hasPremium
                ) {
                    let embed = new MessageEmbed()
                        .setDescription(
                            `Your server has reached the maximum custom messages! (${Config.validation.message.maxCount.birthday.free.toLocaleString()})`
                        )
                        .setFooter(
                            `To have up to ${Config.validation.message.maxCount.birthday.paid.toLocaleString()} custom birthday messages get **Birthday Bot Premium**!`,
                            msg.client.user.avatarURL()
                        )
                        .setColor(Config.colors.error);
                    await MessageUtils.send(channel, embed);
                    return;
                } else if (globalMessageCount >= Config.validation.message.maxCount.birthday.paid) {
                    let embed = new MessageEmbed()
                        .setDescription(
                            `Your server has reached the maximum custom messages! (${Config.validation.message.maxCount.birthday.paid.toLocaleString()})`
                        )
                        .setColor(Config.colors.error);
                    await MessageUtils.send(channel, embed);
                    return;
                }

                // If there is a target, begin the checks if there is a user custom message already for the target
                if (target) {
                    let userMessage = birthdayMessages.filter(
                        message => message.UserDiscordId === target.id
                    );

                    // if it found a message for this user
                    if (userMessage.length > 0) {
                        // There is already a message for this user should they overwrite it?
                        let trueFalseOptions = [Config.emotes.confirm, Config.emotes.deny];

                        let confirmationEmbed = new MessageEmbed()
                            .setTitle('Caution')
                            .setDescription(
                                `There is already a custom message set for this user, would you like to overwrite it?` +
                                    `\n\n**Current Message**: ${userMessage[0].Message}` +
                                    `\n\n**New Message**: ${birthdayMessage}`
                            )
                            .setFooter('This action is irreversible!', msg.client.user.avatarURL())
                            .setColor(Config.colors.warning);

                        let confirmationMessage = await MessageUtils.send(
                            channel,
                            confirmationEmbed
                        ); // Send confirmation and emotes
                        for (let option of trueFalseOptions) {
                            await MessageUtils.react(confirmationMessage, option);
                        }

                        let confirmation: string = await CollectorUtils.collectByReaction(
                            confirmationMessage,
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

                        MessageUtils.delete(confirmationMessage);

                        if (confirmation === undefined) return;

                        // set the overwrite value
                        overwrite = confirmation === Config.emotes.confirm ? true : false;
                    }
                } else {
                    // Don't allow duplicate birthday messages for non user messages
                    let duplicateMessage = birthdayMessages
                        .map(message => message.Message)
                        .includes(birthdayMessage);
                    if (duplicateMessage) {
                        let embed = new MessageEmbed()
                            .setDescription('Duplicate message found for this server!')
                            .setColor(Config.colors.error);
                        await MessageUtils.send(channel, embed);
                        return;
                    }
                }
            }

            let userId = target ? target.id : '0';

            if (overwrite) {
                await this.customMessageRepo.addCustomMessage(
                    msg.guild.id,
                    birthdayMessage,
                    userId,
                    type
                );
            } else {
                let embed = new MessageEmbed()
                    .setDescription('Action Canceled.')
                    .setColor(Config.colors.error);
                await MessageUtils.send(channel, embed);
                return;
            }

            let embed = new MessageEmbed().setColor(Config.colors.success);
            if (!target) {
                embed
                    .setDescription(
                        `Successfully added the birthday message:\n\n\`${birthdayMessage}\`\n\u200b`
                    )
                    .addField(
                        'Actions',
                        '' +
                            '`bday message list [page]` - List all custom birthday messages.' +
                            '\n`bday message test <position> [user count]` - Test a birthday message.'
                    );
            } else {
                embed
                    .setDescription(
                        `Successfully added the user birthday message for ${target.toString()}:\n\n\`${birthdayMessage}\`\n\u200b`
                    )
                    .addField(
                        'Actions',
                        '' +
                            '`bday message list user [page]` - List all user birthday messages.' +
                            '\n`bday message test <user>` - Test a user birthday message.'
                    );
            }
            await MessageUtils.send(channel, embed);
            ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        } else if (type === 'memberanniversary') {
            // It is a member anniversary message
            // Get Message
            let memberAnniversaryMessage: string;

            // Replace with valid placeholders
            memberAnniversaryMessage = msg.content
                .substring(msg.content.toLowerCase().indexOf(type) + type.length + 1)
                .replace(/@users?|<users?>|{users?}/gi, '<Users>')
                .replace(/@years?|<years?>|{years?}/gi, '<Years>');

            if (memberAnniversaryMessage.length > Config.validation.message.maxLength) {
                let embed = new MessageEmbed()
                    .setDescription(
                        `Custom Messages are maxed at ${Config.validation.message.maxLength.toLocaleString()} characters!`
                    )
                    .setColor(Config.colors.error);
                await MessageUtils.send(channel, embed);
                return;
            }

            if (
                !memberAnniversaryMessage.includes('<Users>') ||
                !memberAnniversaryMessage.includes('<Years>')
            ) {
                let embed = new MessageEmbed()
                    .setTitle('Invalid Message')
                    .setDescription(
                        '' +
                            'Please include the `<Users>` and `<Years>` placeholder somewhere in the message. This indicates where anniversary usernames and the year will appear.' +
                            '\n' +
                            '\nEx: `bday message memberAnniversary <Users> is celebrating <Years> year(s) in the discord!`' +
                            '\n\nNote: The `<Years>` placeholder is just a number!'
                    )
                    .setFooter(`${Config.emotes.deny} Action Failed.`, msg.client.user.avatarURL())
                    .setColor(Config.colors.error);
                await MessageUtils.send(channel, embed);
                return;
            }

            let customMessages = await this.customMessageRepo.getCustomMessages(msg.guild.id, type);

            let memberAnniversaryMessages = customMessages.customMessages.filter(
                message => message.Type === 'memberanniversary'
            );

            let globalMessageCount = memberAnniversaryMessages.filter(
                message => message.UserDiscordId === '0'
            ).length;

            if (customMessages) {
                if (
                    globalMessageCount >=
                        Config.validation.message.maxCount.memberAnniversary.free &&
                    !hasPremium
                ) {
                    let embed = new MessageEmbed()
                        .setDescription(
                            `Your server has reached the maximum custom member anniversary messages! (${Config.validation.message.maxCount.memberAnniversary.free.toLocaleString()})`
                        )
                        .setFooter(
                            `To have up to ${Config.validation.message.maxCount.memberAnniversary.paid.toLocaleString()} custom member anniversary messages get **Birthday Bot Premium**!`,
                            msg.client.user.avatarURL()
                        )
                        .setColor(Config.colors.error);
                    await MessageUtils.send(channel, embed);
                    return;
                } else if (
                    globalMessageCount >= Config.validation.message.maxCount.memberAnniversary.paid
                ) {
                    let embed = new MessageEmbed()
                        .setDescription(
                            `Your server has reached the maximum custom member anniversary messages! (${Config.validation.message.maxCount.memberAnniversary.paid.toLocaleString()})`
                        )
                        .setColor(Config.colors.error);
                    await MessageUtils.send(channel, embed);
                    return;
                }

                // Don't allow duplicate member anniversary messages
                let duplicateMessage = memberAnniversaryMessages
                    .map(message => message.Message)
                    .includes(memberAnniversaryMessage);
                if (duplicateMessage) {
                    let embed = new MessageEmbed()
                        .setDescription('Duplicate message found for this server!')
                        .setColor(Config.colors.error);
                    await MessageUtils.send(channel, embed);
                    return;
                }
            }

            await this.customMessageRepo.addCustomMessage(
                msg.guild.id,
                memberAnniversaryMessage,
                '0',
                type
            );

            let embed = new MessageEmbed()
                .setColor(Config.colors.success)
                .setDescription(
                    `Successfully added the member anniversary message:\n\n\`${memberAnniversaryMessage}\`\n\u200b`
                )
                .addField(
                    'Actions',
                    '' +
                        '`bday message list memberAnniversary [page]` - List all custom member anniversary messages.' +
                        '\n`bday message test memberAnniversary <position> [user count]` - Test a member anniversary message.'
                );
            await MessageUtils.send(channel, embed);
            ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        } else if (type === 'serveranniversary') {
            // It is a server anniversary message
            if (!hasPremium) {
                let embed = new MessageEmbed()
                    .setTitle('Premium Required!')
                    .setDescription(
                        'Custom server anniversary messages are a premium only feature! View information about **Birthday Bot Premium** using `bday premium`!'
                    )
                    .setFooter(
                        'Premium helps us support and maintain the bot!',
                        msg.client.user.avatarURL()
                    )
                    .setTimestamp()
                    .setColor(Config.colors.default);
                await MessageUtils.send(channel, embed);
                return;
            }

            // Get Message
            let memberAnniversaryMessage: string;

            // Replace with valid placeholders
            memberAnniversaryMessage = msg.content
                .substring(msg.content.toLowerCase().indexOf(type) + type.length + 1)
                .replace(/@users?|<users?>|{users?}/gi, '<ServerName>')
                .replace(/@years?|<years?>|{years?}/gi, '<Years>');

            if (memberAnniversaryMessage.length > Config.validation.message.maxLength) {
                let embed = new MessageEmbed()
                    .setDescription(
                        `Custom Messages are maxed at ${Config.validation.message.maxLength.toLocaleString()} characters!`
                    )
                    .setColor(Config.colors.error);
                await MessageUtils.send(channel, embed);
                return;
            }

            if (!memberAnniversaryMessage.includes('<Years>')) {
                let embed = new MessageEmbed()
                    .setTitle('Invalid Message')
                    .setDescription(
                        '' +
                            'Please include the `<Years>` placeholder somewhere in the message. This indicates where anniversary year will appear.' +
                            '\n' +
                            '\nEx: `bday message add serverAnniversary <ServerName> is now <Years> years old!' +
                            '\n\nNote: The `<Years>` placeholder is just a number!' +
                            "\n\nNote: The `<ServerName>` placeholder is not required and displays the server's name!"
                    )
                    .setFooter(`${Config.emotes.deny} Action Failed.`, msg.client.user.avatarURL())
                    .setColor(Config.colors.error);
                await MessageUtils.send(channel, embed);
                return;
            }

            let customMessages = await this.customMessageRepo.getCustomMessages(msg.guild.id, type);

            let serverAnniversaryMessages = customMessages.customMessages.filter(
                message => message.Type === 'serveranniversary'
            );

            let globalMessageCount = serverAnniversaryMessages.filter(
                message => message.UserDiscordId === '0'
            ).length;

            if (customMessages) {
                if (
                    globalMessageCount >=
                        Config.validation.message.maxCount.serverAnniversary.free &&
                    !hasPremium
                ) {
                    let embed = new MessageEmbed()
                        .setDescription(
                            `Your server has reached the maximum custom server anniversary messages! (${Config.validation.message.maxCount.serverAnniversary.free.toLocaleString()})`
                        )
                        .setFooter(
                            `To have up to ${Config.validation.message.maxCount.birthday.paid.toLocaleString()} custom member server messages get **Birthday Bot Premium**!`,
                            msg.client.user.avatarURL()
                        )
                        .setColor(Config.colors.error);
                    await MessageUtils.send(channel, embed);
                    return;
                } else if (
                    globalMessageCount >= Config.validation.message.maxCount.serverAnniversary.paid
                ) {
                    let embed = new MessageEmbed()
                        .setDescription(
                            `Your server has reached the maximum custom server anniversary messages! (${Config.validation.message.maxCount.serverAnniversary.paid.toLocaleString()})`
                        )
                        .setColor(Config.colors.error);
                    await MessageUtils.send(channel, embed);
                    return;
                }

                // Don't allow duplicate server anniversary
                let duplicateMessage = serverAnniversaryMessages
                    .map(message => message.Message)
                    .includes(memberAnniversaryMessage);
                if (duplicateMessage) {
                    let embed = new MessageEmbed()
                        .setDescription('Duplicate message found for this server!')
                        .setColor(Config.colors.error);
                    await MessageUtils.send(channel, embed);
                    return;
                }
            }

            await this.customMessageRepo.addCustomMessage(
                msg.guild.id,
                memberAnniversaryMessage,
                '0',
                type
            );

            let embed = new MessageEmbed()
                .setColor(Config.colors.success)
                .setDescription(
                    `Successfully added the server anniversary message:\n\n\`${memberAnniversaryMessage}\`\n\u200b`
                )
                .addField(
                    'Actions',
                    '' +
                        '`bday message list serverAnniversary [page]` - List all custom server anniversary messages.' +
                        '\n`bday message test serverAnniversary <position> [user count]` - Test a server anniversary message.'
                );
            await MessageUtils.send(channel, embed);
        } else {
            let embed = new MessageEmbed()
                .setDescription('Please provide a message type!')
                .setColor(Config.colors.error);
            await MessageUtils.send(channel, embed);
            return;
        }
    }
}
