import {
    CollectOptions,
    CollectorUtils,
    ExpireFunction,
    MessageFilter,
} from 'discord.js-collector-utils';
import { ColorUtils, MessageUtils } from '../../utils';
import { GuildMember, Message, MessageEmbed, MessageReaction, TextChannel, User } from 'discord.js';

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
        let target: GuildMember;
        let userId = '0';
        // Variable that decides if we should overwrite an already set user message (default true as not all messages are user messages)
        let overwrite = true;

        ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        // Try and find someone they are mentioning
        target = msg.mentions.members.first();

        // Did we find a user?
        if (target) {
            if (target.user.bot) {
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
        }
        /**
         * The reason for this ugly code is due to the fact that in a message, if a user mentions someone
         * who either has or has had a nickname, their string format of the mention is <@!USERID>
         * so, we remove the ! if it is there, and replace for both that format, and the original format
         * given by target.toString()
         */
        let mentionWithNickNameFormat =
            target?.toString().substring(0, 2) + '!' + target?.toString().substring(2);
        // Compile the message
        message = msg.content
            .substring(msg.content.toLowerCase().indexOf(type) + type.length + 1)
            .replace(
                target && type !== 'serveranniversary'
                    ? mentionWithNickNameFormat
                    : Lang.getRef('placeHolders.usersRegex', LangCode.EN_US),
                '<Users>'
            )
            .replace(
                target && type !== 'serveranniversary'
                    ? target?.toString()
                    : Lang.getRef('placeHolders.usersRegex', LangCode.EN_US),
                '<Users>'
            )
            .replace(Lang.getRef('placeHolders.serverRegex', LangCode.EN_US), '<Server>')
            .replace(Lang.getRef('placeHolders.yearRegex', LangCode.EN_US), '<Year>');

        if (message.length > Config.validation.message.maxLength) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.maxCustomMessageSize', LangCode.EN_US, {
                    MAX_SIZE: Config.validation.message.maxLength.toString(),
                })
            );
            return;
        }

        if (type === 'birthday' || type === 'memberanniversary') {
            // Can also use year and server name placeholder
            if (!message.includes('<Users>')) {
                await MessageUtils.send(
                    channel,
                    Lang.getEmbed('validation.noUserPlaceholder', LangCode.EN_US)
                );
                return;
            }
        } else {
            if (!message.includes('<Server>')) {
                // NO SERVER PLACEHOLDER (can also use year placeholder)
                await MessageUtils.send(channel, Lang.getNotImplementedEmbed());
                return;
            }
        }

        let customMessages = await this.customMessageRepo.getCustomMessages(msg.guild.id, type);

        let messages = customMessages.customMessages.filter(message => message.Type === type);

        let globalMessageCount = messages.filter(
            message => message.UserDiscordId === '0' && message.Type === type
        ).length;

        let maxMessageCountFree =
            type === 'birthday'
                ? Config.validation.message.maxCount.birthday.free
                : type === 'memberanniversary'
                ? Config.validation.message.maxCount.memberAnniversary.free
                : Config.validation.message.maxCount.serverAnniversary.free;
        let maxMessageCountPaid =
            type === 'birthday'
                ? Config.validation.message.maxCount.birthday.paid
                : type === 'memberanniversary'
                ? Config.validation.message.maxCount.memberAnniversary.paid
                : Config.validation.message.maxCount.serverAnniversary.paid;
        let typeDisplayName =
            type === 'birthday'
                ? 'birthday'
                : type === 'memberanniversary'
                ? 'member anniversary'
                : 'server anniversary';

        if (customMessages) {
            if (globalMessageCount >= maxMessageCountFree && !hasPremium) {
                let embed = new MessageEmbed()
                    .setDescription(
                        `Your server has reached the maximum ${typeDisplayName} custom messages! (${maxMessageCountFree.toLocaleString()})`
                    )
                    .setFooter(
                        `To have up to ${maxMessageCountFree.toString()} custom ${typeDisplayName} messages get Birthday Bot Premium!`,
                        msg.client.user.avatarURL()
                    )
                    .setColor(Config.colors.error);
                await MessageUtils.send(channel, embed);
                return;
            } else if (globalMessageCount >= maxMessageCountPaid) {
                let embed = new MessageEmbed()
                    .setDescription(
                        `Your server has reached the maximum ${typeDisplayName} custom messages! (${maxMessageCountPaid.toLocaleString()})`
                    )
                    .setColor(Config.colors.error);
                await MessageUtils.send(channel, embed);
                return;
            }

            // If there is a target, begin the checks if there is a user custom message already for the target
            if (target && type !== 'serveranniversary') {
                let userMessage = messages.filter(message => message.UserDiscordId === target.id);

                // if it found a message for this user
                if (userMessage.length > 0) {
                    // There is already a message for this user should they overwrite it?
                    let trueFalseOptions = [Config.emotes.confirm, Config.emotes.deny];

                    let confirmationEmbed = new MessageEmbed()
                        .setTitle('Caution')
                        .setDescription(
                            `There is already a ${typeDisplayName} custom message set for this user, would you like to overwrite it?` +
                                `\n\n**Current Message**: ${userMessage[0].Message}` +
                                `\n\n**New Message**: ${message}`
                        )
                        .setFooter('This action is irreversible!', msg.client.user.avatarURL())
                        .setColor(Config.colors.warning);

                    let confirmationMessage = await MessageUtils.send(channel, confirmationEmbed); // Send confirmation and emotes
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
                let duplicateMessage = messages.map(message => message.Message).includes(message);
                if (duplicateMessage) {
                    let embed = new MessageEmbed()
                        .setDescription('Duplicate message found for this server!')
                        .setColor(Config.colors.error);
                    await MessageUtils.send(channel, embed);
                    return;
                }
            }
        }

        // we can let there be an @ in the server anniversary message we just won't consider it a user specific messages
        userId = target && type !== 'serveranniversary' ? target.id : '0';

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

        if (userId === '0') {
            embed.addField(
                'Actions',
                '' +
                    `\`bday message list ${type} [page]\` - List all custom ${typeDisplayName} messages.` +
                    `\n\`bday message test ${type} <position> [user count]\` - Test a ${typeDisplayName} message.`
            );

            description = `Successfully added the ${typeDisplayName} message:\n\n\`${message}\`\n\u200b`;
        } else {
            embed.addField(
                'Actions',
                '' +
                    `\`bday message list ${type} user [page]\` - List all user ${typeDisplayName} messages.` +
                    `\n\`bday message test ${type} <user>\` - Test a user ${typeDisplayName} message.`
            );
            description = `Successfully added the user ${typeDisplayName} message for ${target.toString()}:\n\n\`${message}\`\n\u200b`;
        }

        if (!hasPremium) description += '\nCustomize the message color with `bday premium`! ';

        embed.setDescription(description);

        await MessageUtils.send(channel, embed);

        ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    }
}
