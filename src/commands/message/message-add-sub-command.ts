import {
    CollectOptions,
    CollectorUtils,
    ExpireFunction,
    MessageFilter,
} from 'discord.js-collector-utils';
import { ColorUtils, MessageUtils } from '../../utils';
import { Message, MessageEmbed, MessageReaction, TextChannel, User } from 'discord.js';

import { CustomMessageRepo } from '../../services/database/repos';
import { Lang } from '../../services';
import { LangCode } from '../../models/enums';

let Config = require('../../../config/config.json');

const COLLECT_OPTIONS: CollectOptions = {
    time: Config.experience.promptExpireTime * 1000,
    reset: true,
};

const trueFalseOptions = [Config.emotes.confirm, Config.emotes.deny];

export class MessageAddSubCommand {
    constructor(private customMessageRepo: CustomMessageRepo) {}

    public async execute(
        args: string[],
        msg: Message,
        channel: TextChannel,
        hasPremium: boolean
    ): Promise<void> {
        let stopFilter: MessageFilter = (nextMsg: Message) =>
            nextMsg.author.id === msg.author.id &&
            [Config.prefix, ...Config.stopCommands].includes(
                nextMsg.content.split(/\s+/)[0].toLowerCase()
            );
        let expireFunction: ExpireFunction = async () => {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('results.addMessageExpired', LangCode.EN_US)
            );
        };

        let type = args[3]?.toLowerCase();

        if (
            !type ||
            (type !== 'birthday' && type !== 'memberanniversary' && type !== 'serveranniversary')
        ) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.addMessageInvalidType', LangCode.EN_US)
            );
            return;
        }

        if (args.length < 5) {
            await MessageUtils.send(channel, Lang.getEmbed('validation.noMessage', LangCode.EN_US));
            return;
        }

        let message: string;
        let colorHex = '0';
        let embedChoice: number;
        let target: User;
        let userId = '0';
        // Variable that decides if we should overwrite an already set user message (default true as not all messages are user messages)
        let overwrite = true;

        ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        if (type === 'birthday') {
            // It is a birthday message

            // Try and find someone they are mentioning
            target = msg.mentions.members.first()?.user;

            // Did we find a user?
            if (target) {
                if (target.bot) {
                    await MessageUtils.send(
                        channel,
                        Lang.getEmbed('validation.noUserMessageForBot', LangCode.EN_US)
                    );
                    return;
                } else if (!hasPremium) {
                    await MessageUtils.send(
                        channel,
                        Lang.getEmbed('premiumRequired.userSpecificMessages', LangCode.EN_US)
                    );
                    return;
                }
                // Compile the birthday message
                // THIS NEEDS LOTS OF TESTING WITH DIFFERENT LANGUAGES, COULD BREAK, (might not tho)
                // If the input of the target WASN'T a @mention, replace it with the <@USER_ID> format so the substring works universally
                message = msg.content
                    .replace(args[4], target.toString() + ' ')
                    .substring(msg.content.indexOf(type) + type.length + 23)
                    .replace(Lang.getRef('placeHolders.usersRegex', LangCode.EN_US), '<Users>');
            } else {
                // Compile the birthday message
                // Basic non user-specific custom message
                message = msg.content
                    .substring(msg.content.indexOf(type) + type.length + 1)
                    .replace(Lang.getRef('placeHolders.usersRegex', LangCode.EN_US), '<Users>');
            }

            if (message.length > Config.validation.message.maxLength) {
                await MessageUtils.send(
                    channel,
                    Lang.getEmbed('validation.maxCustomMessageSize', LangCode.EN_US, {
                        MAX_SIZE: Config.validation.message.maxLength.toString(),
                    })
                );
                return;
            }

            if (!message.includes('<Users>')) {
                await MessageUtils.send(
                    channel,
                    Lang.getEmbed('validation.noUserPlaceholder', LangCode.EN_US)
                );
                return;
            }

            let customMessages = await this.customMessageRepo.getCustomMessages(msg.guild.id, type);

            let birthdayMessages = customMessages.customMessages.filter(
                message => message.Type === 'birthday'
            );

            let globalMessageCount = birthdayMessages.filter(
                message => message.UserDiscordId === '0' && message.Type === type
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
                            `To have up to ${Config.validation.message.maxCount.birthday.paid.toString()} custom birthday messages get Birthday Bot Premium!`,
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
                                    `\n\n**New Message**: ${message}`
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

                        // set the overwrite value, needs renamed (not really an overwrite anymore)
                        overwrite = confirmation === Config.emotes.confirm ? true : false;
                    }
                } else {
                    // Don't allow duplicate birthday messages for non user messages
                    let duplicateMessage = birthdayMessages
                        .map(message => message.Message)
                        .includes(message);
                    if (duplicateMessage) {
                        let embed = new MessageEmbed()
                            .setDescription('Duplicate message found for this server!')
                            .setColor(Config.colors.error);
                        await MessageUtils.send(channel, embed);
                        return;
                    }
                }
            }

            userId = target ? target.id : '0';

            ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        } else if (type === 'memberanniversary') {
            // It is a member anniversary message

            // Replace with valid placeholders
            message = msg.content
                .substring(msg.content.toLowerCase().indexOf(type) + type.length + 1)
                .replace(/@users?|<users?>|{users?}/gi, '<Users>')
                .replace(/@years?|<years?>|{years?}/gi, '<Years>');

            if (message.length > Config.validation.message.maxLength) {
                let embed = new MessageEmbed()
                    .setDescription(
                        `Custom Messages are maxed at ${Config.validation.message.maxLength.toLocaleString()} characters!`
                    )
                    .setColor(Config.colors.error);
                await MessageUtils.send(channel, embed);
                return;
            }

            if (!message.includes('<Users>') || !message.includes('<Years>')) {
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
                            `To have up to ${Config.validation.message.maxCount.memberAnniversary.paid.toLocaleString()} custom member anniversary messages get Birthday Bot Premium!`,
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
                    .includes(message);
                if (duplicateMessage) {
                    let embed = new MessageEmbed()
                        .setDescription('Duplicate message found for this server!')
                        .setColor(Config.colors.error);
                    await MessageUtils.send(channel, embed);
                    return;
                }
            }
            ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        } else if (type === 'serveranniversary') {
            // It is a server anniversary message

            // Replace with valid placeholders
            message = msg.content
                .substring(msg.content.toLowerCase().indexOf(type) + type.length + 1)
                .replace(/@users?|<users?>|{users?}/gi, '<ServerName>')
                .replace(/@years?|<years?>|{years?}/gi, '<Years>');

            if (message.length > Config.validation.message.maxLength) {
                let embed = new MessageEmbed()
                    .setDescription(
                        `Custom Messages are maxed at ${Config.validation.message.maxLength.toLocaleString()} characters!`
                    )
                    .setColor(Config.colors.error);
                await MessageUtils.send(channel, embed);
                return;
            }

            if (!message.includes('<Years>')) {
                let embed = new MessageEmbed()
                    .setTitle('Invalid Message')
                    .setDescription(
                        '' +
                            'Please include the `<Years>` placeholder somewhere in the message. This indicates where anniversary year will appear.' +
                            '\n' +
                            '\nEx: `bday message add serverAnniversary <Server> is now <Years> years old!`' +
                            '\n\nNote: The `<Years>` placeholder is just a number!' +
                            `\n\nNote: The \`<Server>\` placeholder is not required and displays the server's name!`
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
                            `To have up to ${Config.validation.message.maxCount.birthday.paid.toLocaleString()} custom member server messages get Birthday Bot Premium**!`,
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
                    .includes(message);
                if (duplicateMessage) {
                    let embed = new MessageEmbed()
                        .setDescription('Duplicate message found for this server!')
                        .setColor(Config.colors.error);
                    await MessageUtils.send(channel, embed);
                    return;
                }
            }
        } else {
            let embed = new MessageEmbed()
                .setDescription('Please provide a message type!')
                .setColor(Config.colors.error);
            await MessageUtils.send(channel, embed);
            return;
        }

        if (hasPremium) {
            let inputColorEmbed = new MessageEmbed()
                .setAuthor(`${msg.guild.name}`, msg.guild.iconURL())
                .setTitle('Birthday Message Color Selection')
                .setDescription(
                    `Please input the color you would like your message. [(?)](${Config.links.docs}/faq#what-is-a-message-embed-color)` +
                        `\nBoth color names and hex values are accepted.`
                )
                .setFooter(`This message expires in 2 minutes!`, msg.client.user.avatarURL())
                .setColor(Config.colors.default)
                .setTimestamp();

            let selectMessage = await MessageUtils.send(channel, inputColorEmbed);

            colorHex = await CollectorUtils.collectByMessage(
                msg.channel,
                // Collect Filter
                (nextMsg: Message) => nextMsg.author.id === msg.author.id,
                stopFilter,
                // Retrieve Result
                async (nextMsg: Message) => {
                    let check = ColorUtils.findHex(nextMsg.content);

                    if (!check) {
                        let embed = new MessageEmbed()
                            .setTitle('Invalid Color')
                            .setDescription(
                                `Please provide a valid hex color! Find hex colors [here](${Config.links.colors}).` +
                                    '\n\nExample: `Orange` or `Crimson`' +
                                    '\nExample: `#4EEFFF` or `4EEFFF`'
                            )
                            .setTimestamp()
                            .setColor(Config.colors.error);
                        await MessageUtils.send(channel, embed);
                        return;
                    }

                    return check;
                },
                expireFunction,
                COLLECT_OPTIONS
            );

            MessageUtils.delete(selectMessage);

            if (colorHex === undefined) {
                return;
            }
        }

        let embedOption = new MessageEmbed()
            .setAuthor(`${msg.guild.name}`, msg.guild.iconURL())
            .setTitle('Custom Message - Embedded')
            .setDescription(
                `Should this message be embedded? [(?)](${Config.links.docs}/faq#what-is-an-embed)` +
                    `\nHint: This message is embed! Non-embedded messages are just plain text.` +
                    `\n\nTrue: ${Config.emotes.confirm}` +
                    `\nFalse: ${Config.emotes.deny}`
            )
            .setFooter(`This message expires in 2 minutes!`, msg.client.user.avatarURL())
            .setColor(Config.colors.default)
            .setTimestamp();

        let settingRole = await MessageUtils.send(channel, embedOption); // Send confirmation and emotes
        for (let option of trueFalseOptions) {
            await settingRole.react(option);
        }

        let option: string = await CollectorUtils.collectByReaction(
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

        MessageUtils.delete(settingRole);

        if (option === undefined) return;

        embedChoice = option === Config.emotes.confirm ? 1 : 0;

        if (overwrite) {
            await this.customMessageRepo.addCustomMessage(
                msg.guild.id,
                message,
                userId,
                type,
                colorHex,
                embedChoice
            );
        } else {
            let embed = new MessageEmbed()
                .setDescription('Action Canceled.')
                .setColor(Config.colors.error);
            await MessageUtils.send(channel, embed);
            return;
        }

        let embed = new MessageEmbed()
            .setTitle('Add Custom Message')
            .setColor(Config.colors.success)
            .setFooter(`${Config.emotes.confirm} Message added.`, msg.client.user.avatarURL())
            .setTimestamp();

        let description: string;

        if (type === 'birthday') {
            if (userId === '0') {
                embed.addField(
                    'Actions',
                    '' +
                        '`bday message list [page]` - List all custom birthday messages.' +
                        '\n`bday message test <position> [user count]` - Test a birthday message.'
                );

                description = `Successfully added the birthday message:\n\n\`${message}\`\n\u200b`;
            } else {
                embed.addField(
                    'Actions',
                    '' +
                        '`bday message list user [page]` - List all user birthday messages.' +
                        '\n`bday message test <user>` - Test a user birthday message.'
                );
                description = `Successfully added the user birthday message for ${target.toString()}:\n\n\`${message}\`\n\u200b`;
            }
        } else if (type === 'memberanniversary') {
            embed.addField(
                'Actions',
                '' +
                    '`bday message list memberAnniversary [page]` - List all custom member anniversary messages.' +
                    '\n`bday message test memberAnniversary <position> [user count]` - Test a member anniversary message.'
            );
            description = `Successfully added the member anniversary message:\n\n\`${message}\`\n\u200b`;
        } else if (type === 'serveranniversary') {
            embed.addField(
                'Actions',
                '' +
                    '`bday message list serverAnniversary [page]` - List all custom server anniversary messages.' +
                    '\n`bday message test serverAnniversary <position> [user count]` - Test a server anniversary message.'
            );
            description = `Successfully added the server anniversary message:\n\n\`${message}\`\n\u200b`;
        }

        if (!hasPremium) description += '\nCustomize the message color with `bday premium`! ';

        embed.setDescription(description);

        await MessageUtils.send(channel, embed);
    }
}
