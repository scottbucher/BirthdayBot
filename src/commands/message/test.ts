import {
    ChatInputApplicationCommandData,
    CommandInteraction,
    GuildMember,
    MessageEmbed,
    PermissionString,
} from 'discord.js';
import moment from 'moment';
import { createRequire } from 'node:module';

import { CustomMessage } from '../../models/database/index.js';
import { EventData } from '../../models/index.js';
import { CustomMessageRepo } from '../../services/database/repos/index.js';
import { Lang } from '../../services/index.js';
import { CelebrationUtils, InteractionUtils } from '../../utils/index.js';
import { Command } from '../index.js';

const require = createRequire(import.meta.url);
let Config = require('../../../config/config.json');

export class MessageTestSubCommand implements Command {
    constructor(public customMessageRepo: CustomMessageRepo) {}
    public metadata: ChatInputApplicationCommandData = {
        name: Lang.getCom('subCommands.test'),
        description: undefined,
    };

    public deferType = undefined;
    public requireDev = false;
    public requireGuild = true;
    public requireClientPerms: PermissionString[] = [];
    public requireUserPerms: PermissionString[] = [];
    public requireSetup = true;
    public requireVote = false;
    public requirePremium = false;

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        let type = intr.options.getString(Lang.getCom('arguments.type')).toLowerCase();
        let databaseType = type.replaceAll('_', ''); // How we store the type in the database, for instance, memberanniversary
        let position = intr.options.getInteger(Lang.getCom('arguments.position')) ?? 0;
        let userCount = intr.options.getUser(Lang.getCom('arguments.userCount')) ?? 1;

        let isUserSpecific = type.includes('user');
        let color = Config.colors.default;
        let hasPremium =
            !Config.payments.enabled || (data.subscription && data.subscription.service);

        /**
         * In the database there are only three types, birthday, member anniversary, and server anniversary.
         * We determine if they are user specific by the UserDiscordId field in the message table
         */
        if (databaseType.includes('users'))
            databaseType = databaseType.includes('birthday') ? 'birthday' : 'memberanniversary';

        let messageData = type.includes('user')
            ? await this.customMessageRepo.getCustomUserMessages(intr.guild.id, databaseType)
            : await this.customMessageRepo.getCustomMessages(intr.guild.id, databaseType);

        let message: CustomMessage;

        // find the position based on if it is a user or global message
        isUserSpecific
            ? (message = messageData.customMessages.find(
                  question => question.Position === position
              ))
            : (message = messageData.customMessages.find(
                  question => question.Position === position
              ));

        if (!message) {
            await InteractionUtils.send(
                intr,
                Lang.getErrorEmbed(
                    'validation',
                    'errorEmbeds.customMessageInvalidPosition',
                    data.lang(),
                    {
                        ICON: intr.client.user.displayAvatarURL(),
                    }
                )
            );
            return;
        }

        let botMember = intr.guild.members.resolve(intr.client.user);

        let memberList: GuildMember[] = [];

        let target = intr.guild.members.resolve(message.UserDiscordId) ?? botMember;

        for (let i = 0; i < userCount; i++) {
            memberList.push(isUserSpecific ? target : botMember);
        }

        let userList = CelebrationUtils.getUserListString(data.guild, memberList);

        // Retrieve message to remove
        let messages = target
            ? await this.customMessageRepo.getCustomUserMessages(intr.guild.id, type)
            : await this.customMessageRepo.getCustomMessages(intr.guild.id, type);

        let year =
            type === 'member_anniversary'
                ? moment().diff(
                      target
                          ? target.joinedAt
                          : intr.guild.members.resolve(intr.client.user).joinedAt,
                      'years'
                  ) + 1
                : type === 'server_anniversary'
                ? moment().diff(intr.guild.createdAt, 'years') + 1
                : null;

        if (isUserSpecific && position === 0) {
            // There isn't a default user specific messages
            await InteractionUtils.send(
                intr,
                Lang.getErrorEmbed(
                    'validation',
                    'errorEmbeds.noDefaultUserSpecificMessages',
                    data.lang()
                )
            );
        }

        if (messages.customMessages.length === 0 || position === 0) {
            let defaultMessage =
                type === 'member_anniversary'
                    ? Lang.getRef('info', 'defaults.memberAnniversaryMessage', data.lang())
                    : type === 'server_anniversary'
                    ? Lang.getRef('info', 'defaults.serverAnniversaryMessage', data.lang())
                    : Lang.getRef('info', 'defaults.birthdayMessage', data.lang());

            await InteractionUtils.send(
                intr,
                new MessageEmbed()
                    .setDescription(
                        CelebrationUtils.replacePlaceHolders(
                            defaultMessage,
                            intr.guild,
                            databaseType,
                            userList,
                            year
                        )
                    )
                    .setColor(color)
            );
            return;
        }

        let chosenMessage = target
            ? messages.customMessages.find(message => message.UserDiscordId === target.id)
            : messages.customMessages.find(message => message.Position === position);

        let customMessage = CelebrationUtils.replacePlaceHolders(
            chosenMessage?.Message,
            intr.guild,
            databaseType,
            userList,
            year
        );

        // TODO: recheck this color logic
        if (!customMessage) {
            await InteractionUtils.send(
                intr,
                Lang.getEmbed('validation', 'embeds.messageDoesNotExist', data.lang(), {
                    ICON: intr.client.user.displayAvatarURL(),
                })
            );
            return;
        } else if (hasPremium) {
            color = chosenMessage?.Color ?? color;
        }

        if (chosenMessage.Embed) {
            let embed = new MessageEmbed().setDescription(customMessage).setColor(color);
            await InteractionUtils.send(intr, embed);
        } else {
            await InteractionUtils.send(intr, customMessage);
        }
    }
}
