import { RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord-api-types/v10';
import {
    ButtonInteraction,
    CommandInteraction,
    GuildMember,
    Message,
    PermissionString,
} from 'discord.js';
import { createRequire } from 'node:module';

import { EventData } from '../../models/index.js';
import { CustomMessageRepo } from '../../services/database/repos/index.js';
import { Lang } from '../../services/index.js';
import {
    CelebrationUtils,
    ClientUtils,
    CollectorUtils,
    ColorUtils,
    InteractionUtils,
} from '../../utils/index.js';
import { Command } from '../index.js';

const require = createRequire(import.meta.url);
let Config = require('../../../config/config.json');

/**
 * Reminder on how types vs display types should work.
 * type comes in as either birthday, member_anniversary, or server_anniversary
 * display types are gotten from the Lang system
 */
export class MessageAddSubCommand implements Command {
    constructor(public customMessageRepo: CustomMessageRepo) {}
    public metadata: RESTPostAPIChatInputApplicationCommandsJSONBody = {
        name: Lang.getCom('subCommands.add'),
        description: undefined,
    };

    public deferType = undefined;
    public requireDev = false;
    public requireClientPerms: PermissionString[] = ['VIEW_CHANNEL'];
    public requireSetup = true;
    public requireVote = false;
    public requirePremium = false;

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        let type = intr.options.getString(Lang.getCom('arguments.type')).toLowerCase(); // How the type comes in, for instance, MEMBER_ANNIVERSARY
        let databaseType = type.replaceAll('_', ''); // How we store the type in the database, for instance, memberanniversary
        let commandDisplayType: string; // How we display the type when using it in an example, for instance "/message list memberAnniversary"
        let typeDisplayName: string; // How we display the type when talking about it, for instance "A Member Anniversary is..."
        let message = intr.options.getString(Lang.getCom('arguments.message'));

        /**
         * In the database there are only three types, birthday, member anniversary, and server anniversary.
         * We determine if they are user specific by the UserDiscordId field in the message table
         */
        if (databaseType.includes('specific'))
            databaseType = databaseType.includes('birthday') ? 'birthday' : 'memberanniversary';

        let colorResult = '0';
        let embedResult: { intr: ButtonInteraction; value: boolean };
        let target: GuildMember;
        let userId = '0';

        // Target needs to be the determining factor of if this is a user specific message or not
        target = await ClientUtils.findMember(intr.guild, message);

        // Did we find a user?
        if (target) {
            if (target.user.bot) {
                await InteractionUtils.send(
                    intr,
                    Lang.getEmbed('validation', 'errorEmbeds.noUserMessageForBot', data.lang())
                );
                return;
            } else if (!data.hasPremium) {
                await InteractionUtils.send(
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

        // Build our command display type based on if there was a user or not
        if (target) {
            commandDisplayType = type.includes('birthday')
                ? 'userSpecificBirthday'
                : 'userSpecificMemberAnniversary';
        } else {
            commandDisplayType = type.includes('member')
                ? 'memberAnniversary'
                : type.includes('server')
                ? 'serverAnniversary'
                : 'birthday';
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

        /**
         * Replace all of the placeholders (using the regex in the lang files to
         * account for all the old versions of the placeholders) and add in the
         * new version of the placeholders. If it is a user specific message,
         * we replace the mentionWithNickNameFormat with the placeholder otherwise
         * just use the regex
         */
        message = message
            .replaceAll(
                target && type !== 'server_anniversary'
                    ? mentionWithNickNameFormat
                    : Lang.getRegex('info', 'placeHolders.usersRegex', data.lang()),
                '{Users}'
            )
            .replaceAll(
                target && type !== 'server_anniversary'
                    ? target?.toString()
                    : Lang.getRegex('info', 'placeHolders.usersRegex', data.lang()),
                '{Users}'
            )
            .replaceAll(Lang.getRegex('info', 'placeHolders.serverRegex', data.lang()), '{Server}')
            .replaceAll(Lang.getRegex('info', 'placeHolders.yearRegex', data.lang()), '{Year}');

        if (message.length > Config.validation.message.maxLength) {
            await InteractionUtils.send(
                intr,
                Lang.getEmbed('validation', 'embeds.maxCustomMessageSize', data.lang(), {
                    MAX_SIZE: Config.validation.message.maxLength.toString(),
                })
            );
            return;
        }

        // Ensure the required placeholders are in the message
        if (type === 'birthday' || type === 'member_anniversary') {
            // Can also use year and server name placeholder
            if (!message.includes('{Users}')) {
                await InteractionUtils.send(
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
            if (!message.includes('{Server}')) {
                // NO SERVER PLACEHOLDER (can also use year placeholder)
                // TODO: Should this be required?
                await InteractionUtils.send(
                    intr,
                    Lang.getEmbed('validation', 'embeds.noServerPlaceholder', data.lang())
                );
                return;
            }
        }

        typeDisplayName =
            type === 'birthday'
                ? Lang.getRef('info', 'terms.birthday', data.lang()).toLowerCase()
                : type === 'member_anniversary'
                ? Lang.getRef('info', 'terms.memberAnniversary', data.lang()).toLowerCase()
                : Lang.getRef('info', 'terms.serverAnniversary', data.lang()).toLowerCase();

        let customMessages = await this.customMessageRepo.getCustomMessages(
            intr.guild.id,
            databaseType
        );

        let messages = customMessages.customMessages.filter(
            message => message.Type === databaseType
        );

        let globalMessageCount = messages.filter(
            message => message.UserDiscordId === '0' && message.Type === type
        ).length;

        let maxMessageCountFree =
            type === 'birthday'
                ? Config.validation.message.maxCount.birthday.free
                : type === 'member_anniversary'
                ? Config.validation.message.maxCount.memberAnniversary.free
                : Config.validation.message.maxCount.serverAnniversary.free;
        let maxMessageCountPaid =
            type === 'birthday'
                ? Config.validation.message.maxCount.birthday.paid
                : type === 'member_anniversary'
                ? Config.validation.message.maxCount.memberAnniversary.paid
                : Config.validation.message.maxCount.serverAnniversary.paid;

        // Check if they have reached the max custom messages for this type
        if (customMessages) {
            if (globalMessageCount >= maxMessageCountFree && !data.hasPremium) {
                await InteractionUtils.send(
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
                await InteractionUtils.send(
                    intr,
                    Lang.getEmbed('validation', 'embeds.maxPaidCustomMessages', data.lang(), {
                        TYPE: typeDisplayName,
                        PAID_MAX: maxMessageCountPaid,
                    })
                );
                return;
            }
        }

        let nextIntr: CommandInteraction | ButtonInteraction = intr;

        // If there is a target, begin the checks if there is a user custom message already for the target
        if (target && type !== 'server_anniversary') {
            let userMessage = messages.filter(message => message.UserDiscordId === target.id);

            // if it found a message for this user
            if (userMessage.length > 0) {
                // There is already a message for this user should they overwrite it?

                let replaceResult = await CollectorUtils.getBooleanFromButton(
                    intr,
                    data,
                    Lang.getEmbed('validation', 'embeds.duplicateUserCustomMessage', data.lang(), {
                        TYPE: typeDisplayName,
                        CURRENT_MESSAGE: userMessage[0].Message.replaceAll(
                            '{Users}',
                            target.toString()
                        ),
                        NEW_MESSAGE: CelebrationUtils.replaceLangPlaceHolders(
                            message,
                            intr.guild,
                            databaseType,
                            target?.toString()
                        ),
                        ICON: intr.client.user.displayAvatarURL(),
                    })
                );

                if (replaceResult === undefined) return;

                if (!replaceResult.value) {
                    await InteractionUtils.send(
                        replaceResult.intr,
                        Lang.getEmbed('results', 'fail.actionCanceled', data.lang())
                    );
                    return;
                }
                nextIntr = replaceResult.intr;
            }
        } else {
            // Don't allow duplicate birthday messages for non user messages
            let duplicateMessage = messages.map(message => message.Message).includes(message);
            if (duplicateMessage) {
                await InteractionUtils.send(
                    intr,
                    Lang.getErrorEmbed('validation', 'errorEmbeds.duplicateMessage', data.lang())
                );
                return;
            }
        }

        // we can let there be an @ in the server anniversary message we just won't consider it a user specific messages
        userId = target && type !== 'server_anniversary' ? target.id : '0';

        // Only premium servers can have a custom color
        if (data.hasPremium) {
            // prompt them for a color
            await InteractionUtils.send(
                nextIntr,
                Lang.getEmbed('prompts', 'customMessage.colorSelection', data.lang(), {
                    ICON: intr.client.user.displayAvatarURL(),
                })
            );

            colorResult = await CollectorUtils.collectByMessage(
                intr.channel,
                intr.user,
                async (nextMsg: Message) => {
                    let check = ColorUtils.findHex(nextMsg.content);

                    if (!check) {
                        await InteractionUtils.send(
                            intr,
                            Lang.getEmbed('validation', 'embeds.invalidColor', data.lang())
                        );
                        return;
                    }

                    return check;
                },
                async () => {
                    await InteractionUtils.send(
                        intr,
                        Lang.getEmbed('results', 'fail.promptExpired', data.lang())
                    );
                }
            );

            if (colorResult === undefined) return;
        }

        // Check if this message should be an embed or not
        embedResult = await CollectorUtils.getBooleanFromButton(
            intr,
            data,
            Lang.getEmbed('prompts', 'customMessage.embedSelection', data.lang(), {
                ICON: intr.client.user.displayAvatarURL(),
            })
        );

        if (embedResult === undefined) return;

        await this.customMessageRepo.addCustomMessage(
            intr.guild.id,
            message,
            userId,
            databaseType,
            colorResult,
            embedResult.value ? 1 : 0
        );

        await InteractionUtils.send(
            embedResult.intr,
            userId === '0'
                ? Lang.getEmbed('results', 'customMessage.add', data.lang(), {
                      DISPLAY_TYPE: typeDisplayName,
                      MESSAGE: CelebrationUtils.replaceLangPlaceHolders(
                          message,
                          intr.guild,
                          databaseType,
                          null
                      ),
                      IS_EMBED: embedResult.value ? 'True' : 'False',
                      HAS_PREMIUM: !data.hasPremium
                          ? Lang.getRef('info', 'conditionals.needColorForPremium', data.lang())
                          : Lang.getRef('info', 'conditionals.colorForPremium', data.lang(), {
                                COLOR_HEX: colorResult,
                            }),
                      TYPE: commandDisplayType,
                      ICON: intr.client.user.displayAvatarURL(),
                  })
                : Lang.getEmbed('results', 'customMessage.addUserSpecific', data.lang(), {
                      DISPLAY_TYPE: typeDisplayName,
                      MESSAGE: CelebrationUtils.replaceLangPlaceHolders(
                          message,
                          intr.guild,
                          databaseType,
                          target?.toString()
                      ),
                      IS_EMBED: embedResult.value ? 'True' : 'False',
                      HAS_PREMIUM: !data.hasPremium
                          ? Lang.getRef('info', 'conditionals.colorForPremium', data.lang())
                          : Lang.getRef('info', 'conditionals.colorForPremium', data.lang(), {
                                COLOR_HEX: colorResult,
                            }),
                      TYPE: commandDisplayType,
                      USER: target.toString(),
                      ICON: intr.client.user.displayAvatarURL(),
                  })
        );
    }
}
