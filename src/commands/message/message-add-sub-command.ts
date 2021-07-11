import { CelebrationUtils, ColorUtils, FormatUtils, MessageUtils } from '../../utils';
import {
    CollectOptions,
    CollectorUtils,
    ExpireFunction,
    MessageFilter,
} from 'discord.js-collector-utils';
import { GuildMember, Message, MessageReaction, TextChannel, User } from 'discord.js';

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
            await MessageUtils.reply(msg, Lang.getEmbed('results.promptExpired', LangCode.EN_US));
        };
        // get the english types based on their inputted types, if it equals none set to nothing so it fails on the next check
        let type = FormatUtils.extractCelebrationType(args[3]?.toLowerCase());
        if (
            !type ||
            (type !== 'birthday' && type !== 'memberanniversary' && type !== 'serveranniversary')
        ) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.addMessageInvalidType', LangCode.EN_US, {
                    ICON: msg.client.user.avatarURL(),
                })
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
                    Lang.getEmbed('premiumRequired.userSpecificMessages', LangCode.EN_US, {
                        ICON: msg.client.user.avatarURL(),
                    })
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

        let typeDisplayName =
            type === 'birthday'
                ? Lang.getRef('terms.birthday', LangCode.EN_US).toLowerCase()
                : type === 'memberanniversary'
                ? Lang.getRef('terms.memberAnniversary', LangCode.EN_US).toLowerCase()
                : Lang.getRef('terms.serverAnniversary', LangCode.EN_US).toLowerCase();

        if (type === 'birthday' || type === 'memberanniversary') {
            // Can also use year and server name placeholder
            if (!message.includes('<Users>')) {
                await MessageUtils.send(
                    channel,
                    Lang.getEmbed('validation.noUserPlaceholder', LangCode.EN_US, {
                        TYPE: type,
                        EXAMPLE_MESSAGE: Lang.getRef(
                            type === 'birthday'
                                ? 'defaults.birthdayMessage'
                                : 'defaults.memberAnniversaryMessage',
                            LangCode.EN_US
                        ),
                    })
                );
                return;
            }
        } else {
            if (!message.includes('<Server>')) {
                // NO SERVER PLACEHOLDER (can also use year placeholder)
                await MessageUtils.send(
                    channel,
                    Lang.getEmbed('validation.noServerPlaceholder', LangCode.EN_US)
                );
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

        if (customMessages) {
            if (globalMessageCount >= maxMessageCountFree && !hasPremium) {
                await MessageUtils.send(
                    channel,
                    Lang.getEmbed('validation.maxFreeCustomMessages', LangCode.EN_US, {
                        TYPE: typeDisplayName,
                        FREE_MAX: maxMessageCountFree,
                        PAID_MAX: maxMessageCountPaid,
                        ICON: msg.client.user.avatarURL(),
                    })
                );
                return;
            } else if (globalMessageCount >= maxMessageCountPaid) {
                await MessageUtils.send(
                    channel,
                    Lang.getEmbed('validation.maxPaidCustomMessages', LangCode.EN_US, {
                        TYPE: typeDisplayName,
                        PAID_MAX: maxMessageCountPaid,
                    })
                );
                return;
            }

            // If there is a target, begin the checks if there is a user custom message already for the target
            if (target && type !== 'serveranniversary') {
                let userMessage = messages.filter(message => message.UserDiscordId === target.id);

                // if it found a message for this user
                if (userMessage.length > 0) {
                    // There is already a message for this user should they overwrite it?
                    let trueFalseOptions = [Config.emotes.confirm, Config.emotes.deny];

                    let confirmationMessage = await MessageUtils.send(
                        channel,
                        Lang.getEmbed('validation.duplicateUserCustomMessage', LangCode.EN_US, {
                            TYPE: typeDisplayName,
                            CURRENT_MESSAGE: userMessage[0].Message.replace(
                                '<Users>',
                                target.toString()
                            ),
                            NEW_MESSAGE: CelebrationUtils.replaceLangPlaceHolders(
                                message,
                                msg.guild,
                                type,
                                target?.toString()
                            ),
                            ICON: msg.client.user.avatarURL(),
                        })
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

                    if (confirmation === Config.emotes.deny) {
                        await MessageUtils.send(
                            channel,
                            Lang.getEmbed('results.actionCanceled', LangCode.EN_US)
                        );
                        return;
                    }
                }
            } else {
                // Don't allow duplicate birthday messages for non user messages
                let duplicateMessage = messages.map(message => message.Message).includes(message);
                if (duplicateMessage) {
                    await MessageUtils.send(
                        channel,
                        Lang.getEmbed('validation.duplicateMessage', LangCode.EN_US)
                    );
                    return;
                }
            }
        }

        // we can let there be an @ in the server anniversary message we just won't consider it a user specific messages
        userId = target && type !== 'serveranniversary' ? target.id : '0';

        if (hasPremium) {
            let selectMessage = await MessageUtils.send(
                channel,
                Lang.getEmbed('serverPrompts.customMessageColorSelection', LangCode.EN_US, {
                    ICON: msg.client.user.avatarURL(),
                })
            );

            colorHex = await CollectorUtils.collectByMessage(
                msg.channel,
                // Collect Filter
                (nextMsg: Message) => nextMsg.author.id === msg.author.id,
                stopFilter,
                // Retrieve Result
                async (nextMsg: Message) => {
                    let check = ColorUtils.findHex(nextMsg.content);

                    if (!check) {
                        await MessageUtils.send(
                            channel,
                            Lang.getEmbed('validation.invalidColor', LangCode.EN_US)
                        );
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

        let settingRole = await MessageUtils.send(
            channel,
            Lang.getEmbed('serverPrompts.customMessageEmbedSelection', LangCode.EN_US, {
                ICON: msg.client.user.avatarURL(),
            })
        ); // Send confirmation and emotes
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

        await this.customMessageRepo.addCustomMessage(
            msg.guild.id,
            message,
            userId,
            type,
            colorHex,
            embedChoice
        );

        await MessageUtils.send(
            channel,
            userId === '0'
                ? Lang.getEmbed('results.addCustomMessage', LangCode.EN_US, {
                      DISPLAY_TYPE: typeDisplayName,
                      MESSAGE: CelebrationUtils.replaceLangPlaceHolders(
                          message,
                          msg.guild,
                          type,
                          null
                      ),
                      IS_EMBED: embedChoice === 1 ? 'True' : 'False',
                      HAS_PREMIUM: !hasPremium
                          ? Lang.getRef('conditionals.needColorForPremium', LangCode.EN_US)
                          : Lang.getRef('conditionals.colorForPremium', LangCode.EN_US, {
                                COLOR_HEX: colorHex,
                            }),
                      TYPE: type,
                      ICON: msg.client.user.avatarURL(),
                  })
                : Lang.getEmbed('results.addCustomUserMessage', LangCode.EN_US, {
                      DISPLAY_TYPE: typeDisplayName,
                      MESSAGE: CelebrationUtils.replaceLangPlaceHolders(
                          message,
                          msg.guild,
                          type,
                          target?.toString()
                      ),
                      IS_EMBED: embedChoice === 1 ? 'True' : 'False',
                      HAS_PREMIUM: !hasPremium
                          ? Lang.getRef('conditionals.colorForPremium', LangCode.EN_US)
                          : Lang.getRef('conditionals.colorForPremium', LangCode.EN_US, {
                                COLOR_HEX: colorHex,
                            }),
                      TYPE:
                          type === 'birthday'
                              ? 'userSpecificBirthday'
                              : 'userSpecificMemberAnniversary',
                      USER: target.toString(),
                      ICON: msg.client.user.avatarURL(),
                  })
        );

        ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    }
}
