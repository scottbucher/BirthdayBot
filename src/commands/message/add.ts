import {
    ApplicationCommandData,
    PermissionString,
    CommandInteraction,
    GuildMember,
    Message,
} from 'discord.js';

import { Command } from '..';
import { EventData } from '../../models';
import { Lang } from '../../services';
import { CustomMessageRepo } from '../../services/database/repos';
import { CelebrationUtils, ColorUtils, MessageUtils } from '../../utils';
import { CollectorUtils } from '../../utils/collector-utils';

let Config = require('../../../config/config.json');

export class MessageAddSubCommand implements Command {
    constructor(public customMessageRepo: CustomMessageRepo) {}
    public metadata: ApplicationCommandData = {
        name: Lang.getCom('subCommands.add'),
        description: undefined,
    };

    public requireDev = false;
    public requireGuild = true;
    public requireClientPerms: PermissionString[] = [];
    public requireUserPerms: PermissionString[] = [];
    public requireSetup = true;
    public requireVote = false;
    public requirePremium = false;

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        let type = intr.options.getString(Lang.getCom('arguments.type')).toLowerCase();
        let message = intr.options.getString(Lang.getCom('arguments.message'));

        let colorHex = '0';
        let embedChoice: number;
        let target: GuildMember;
        let userId = '0';
        let hasPremium = data.subscription && data.subscription.service;

        ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        // TODO: Use regex to parse a user input
        target = null;

        // Did we find a user?
        if (target) {
            if (target.user.bot) {
                await MessageUtils.sendIntr(
                    intr,
                    Lang.getEmbed('validation', 'errorEmbeds.noUserMessageForBot', data.lang())
                );
                return;
            } else if (!hasPremium) {
                await MessageUtils.sendIntr(
                    intr,
                    Lang.getEmbed(
                        'validation',
                        'embeds.userSpecificMessagesNeedsPremium',
                        data.lang(),
                        {
                            ICON: intr.client.user.displayAvatarURL(),
                        }
                    )
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
        message = message
            .replace(
                target && type !== 'serveranniversary'
                    ? mentionWithNickNameFormat
                    : Lang.getRef('info', 'placeHolders.usersRegex', data.lang()),
                '%Users%'
            )
            .replace(
                target && type !== 'serveranniversary'
                    ? target?.toString()
                    : Lang.getRef('info', 'placeHolders.usersRegex', data.lang()),
                '%Users%'
            )
            .replace(Lang.getRef('info', 'placeHolders.serverRegex', data.lang()), '%Server%')
            .replace(Lang.getRef('info', 'placeHolders.yearRegex', data.lang()), '%Year%');

        if (message.length > Config.validation.message.maxLength) {
            await MessageUtils.sendIntr(
                intr,
                Lang.getEmbed('validation', 'embeds.maxCustomMessageSize', data.lang(), {
                    MAX_SIZE: Config.validation.message.maxLength.toString(),
                })
            );
            return;
        }

        let typeDisplayName =
            type === 'birthday'
                ? Lang.getRef('info', 'terms.birthday', data.lang()).toLowerCase()
                : type === 'memberanniversary'
                ? Lang.getRef('info', 'terms.memberAnniversary', data.lang()).toLowerCase()
                : Lang.getRef('info', 'terms.serverAnniversary', data.lang()).toLowerCase();

        if (type === 'birthday' || type === 'memberanniversary') {
            // Can also use year and server name placeholder
            if (!message.includes('%Users%')) {
                await MessageUtils.sendIntr(
                    intr,
                    Lang.getEmbed('validation', 'embeds.noUserPlaceholder', data.lang(), {
                        TYPE: type,
                        EXAMPLE_MESSAGE: Lang.getRef(
                            'info',
                            type === 'birthday'
                                ? 'defaults.birthdayMessage'
                                : 'defaults.memberAnniversaryMessage',
                            data.lang()
                        ),
                    })
                );
                return;
            }
        } else {
            if (!message.includes('%Server%')) {
                // NO SERVER PLACEHOLDER (can also use year placeholder)
                // TODO: Should this be required?
                await MessageUtils.sendIntr(
                    intr,
                    Lang.getEmbed('validation', 'embeds.noServerPlaceholder', data.lang())
                );
                return;
            }
        }

        let customMessages = await this.customMessageRepo.getCustomMessages(intr.guild.id, type);

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
                await MessageUtils.sendIntr(
                    intr,
                    Lang.getEmbed('validation', 'embeds.maxFreeCustomMessages', data.lang(), {
                        TYPE: typeDisplayName,
                        FREE_MAX: maxMessageCountFree,
                        PAID_MAX: maxMessageCountPaid,
                        ICON: intr.client.user.displayAvatarURL(),
                    })
                );
                return;
            } else if (globalMessageCount >= maxMessageCountPaid) {
                await MessageUtils.sendIntr(
                    intr,
                    Lang.getEmbed('validation', 'embeds.maxPaidCustomMessages', data.lang(), {
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

                    let confirmation = await CollectorUtils.getBooleanFromReact(
                        intr,
                        data,
                        Lang.getEmbed(
                            'validation',
                            'embeds.duplicateUserCustomMessage',
                            data.lang(),
                            {
                                TYPE: typeDisplayName,
                                CURRENT_MESSAGE: userMessage[0].Message.replace(
                                    '%Users%',
                                    target.toString()
                                ),
                                NEW_MESSAGE: CelebrationUtils.replaceLangPlaceHolders(
                                    message,
                                    intr.guild,
                                    type,
                                    target?.toString()
                                ),
                                ICON: intr.client.user.displayAvatarURL(),
                            }
                        )
                    );

                    if (confirmation === undefined) return;

                    if (!confirmation) {
                        await MessageUtils.sendIntr(
                            intr,
                            Lang.getEmbed('results', 'fail.actionCanceled', data.lang())
                        );
                        return;
                    }
                }
            } else {
                // Don't allow duplicate birthday messages for non user messages
                let duplicateMessage = messages.map(message => message.Message).includes(message);
                if (duplicateMessage) {
                    await MessageUtils.sendIntr(
                        intr,
                        Lang.getErrorEmbed(
                            'validation',
                            'errorEmbeds.duplicateMessage',
                            data.lang()
                        )
                    );
                    return;
                }
            }
        }

        // we can let there be an @ in the server anniversary message we just won't consider it a user specific messages
        userId = target && type !== 'serveranniversary' ? target.id : '0';

        if (hasPremium) {
            // prompt them for a type
            let collect = CollectorUtils.createMsgCollect(intr.channel, intr.user, async () => {
                await MessageUtils.sendIntr(
                    intr,
                    Lang.getEmbed('results', 'fail.promptExpired', data.lang())
                );
            });

            await MessageUtils.sendIntr(
                intr,
                Lang.getEmbed('prompts', 'customMessage.colorSelection', data.lang(), {
                    ICON: intr.client.user.displayAvatarURL(),
                })
            );

            colorHex = await collect(async (nextMsg: Message) => {
                let check = ColorUtils.findHex(nextMsg.content);

                if (!check) {
                    await MessageUtils.sendIntr(
                        intr,
                        Lang.getEmbed('validation', 'embeds.invalidColor', data.lang())
                    );
                    return;
                }

                return check;
            });
            if (colorHex === undefined) return;
        }

        let option = await CollectorUtils.getBooleanFromReact(
            intr,
            data,
            Lang.getEmbed('prompts', 'customMessage.embedSelection', data.lang(), {
                ICON: intr.client.user.displayAvatarURL(),
            })
        );

        if (option === undefined) return;

        embedChoice = option === Config.emotes.confirm ? 1 : 0;

        await this.customMessageRepo.addCustomMessage(
            intr.guild.id,
            message,
            userId,
            type,
            colorHex,
            embedChoice
        );

        await MessageUtils.sendIntr(
            intr,
            userId === '0'
                ? Lang.getEmbed('results', 'customMessage.add', data.lang(), {
                      DISPLAY_TYPE: typeDisplayName,
                      MESSAGE: CelebrationUtils.replaceLangPlaceHolders(
                          message,
                          intr.guild,
                          type,
                          null
                      ),
                      IS_EMBED: embedChoice === 1 ? 'True' : 'False',
                      HAS_PREMIUM: !hasPremium
                          ? Lang.getRef('info', 'conditionals.needColorForPremium', data.lang())
                          : Lang.getRef('info', 'conditionals.colorForPremium', data.lang(), {
                                COLOR_HEX: colorHex,
                            }),
                      TYPE: type,
                      ICON: intr.client.user.displayAvatarURL(),
                  })
                : Lang.getEmbed('results', 'customMessage.addUserSpecific', data.lang(), {
                      DISPLAY_TYPE: typeDisplayName,
                      MESSAGE: CelebrationUtils.replaceLangPlaceHolders(
                          message,
                          intr.guild,
                          type,
                          target?.toString()
                      ),
                      IS_EMBED: embedChoice === 1 ? 'True' : 'False',
                      HAS_PREMIUM: !hasPremium
                          ? Lang.getRef('info', 'conditionals.colorForPremium', data.lang())
                          : Lang.getRef('info', 'conditionals.colorForPremium', data.lang(), {
                                COLOR_HEX: colorHex,
                            }),
                      TYPE:
                          type === 'birthday'
                              ? 'userSpecificBirthday'
                              : 'userSpecificMemberAnniversary',
                      USER: target.toString(),
                      ICON: intr.client.user.displayAvatarURL(),
                  })
        );
    }
}
