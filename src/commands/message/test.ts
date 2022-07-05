import { RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord-api-types/v10';
import {
    CommandInteraction,
    GuildMember,
    InteractionReplyOptions,
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
    public metadata: RESTPostAPIChatInputApplicationCommandsJSONBody = {
        name: Lang.getCom('subCommands.test'),
        description: undefined,
    };

    public deferType = undefined;
    public requireDev = false;
    public requireClientPerms: PermissionString[] = [];
    public requireSetup = true;
    public requireVote = false;
    public requirePremium = false;

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        let type = intr.options.getString(Lang.getCom('arguments.type')).toLowerCase();
        let databaseType = type.replaceAll('_', ''); // How we store the type in the database, for instance, memberanniversary
        let position = intr.options.getInteger(Lang.getCom('arguments.position')) ?? 0;
        let userCount = intr.options.getInteger(Lang.getCom('arguments.userCount')) ?? 1;

        let isUserSpecific = type.includes('user');
        let color = Config.colors.default;

        /**
         * In the database there are only three types, birthday, member anniversary, and server anniversary.
         * We determine if they are user specific by the UserDiscordId field in the message table
         */
        if (databaseType.includes('specific'))
            databaseType = databaseType.includes('birthday') ? 'birthday' : 'memberanniversary';

        let messageData = type.includes('user')
            ? await this.customMessageRepo.getCustomUserMessages(intr.guild.id, databaseType)
            : await this.customMessageRepo.getCustomMessages(intr.guild.id, databaseType);

        let message: CustomMessage;
        let msgOptions: InteractionReplyOptions = {};
        let mentionString = CelebrationUtils.getMentionString(data.guild, intr.guild, type);

        if (mentionString && mentionString !== '') msgOptions.content = mentionString;

        // find the position based on if it is a user or global message
        isUserSpecific
            ? (message = messageData.customMessages.find(
                  question => question.Position === position
              ))
            : (message = messageData.customMessages.find(
                  question => question.Position === position
              ));

        if (!message && position !== 0) {
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

        let target = intr.guild.members.resolve(message?.UserDiscordId) ?? botMember;

        for (let i = 0; i < userCount; i++) {
            memberList.push(isUserSpecific ? target : botMember);
        }

        let userList = CelebrationUtils.getUserListString(data.guild, memberList);

        let year = type.includes('member')
            ? moment().diff(
                  isUserSpecific
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
            return;
        }

        if (messageData.customMessages.length === 0 || position === 0) {
            let defaultMessage =
                type === 'member_anniversary'
                    ? Lang.getRef('info', 'defaults.memberAnniversaryMessage', data.lang())
                    : type === 'server_anniversary'
                    ? Lang.getRef('info', 'defaults.serverAnniversaryMessage', data.lang())
                    : Lang.getRef('info', 'defaults.birthdayMessage', data.lang());

            msgOptions.embeds = [
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
                    .setColor(color),
            ];

            await InteractionUtils.send(intr, msgOptions);
            return;
        }

        let chosenMessage = isUserSpecific
            ? messageData.customMessages.find(message => message.UserDiscordId === target.id)
            : messageData.customMessages.find(message => message.Position === position);

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
        } else if (data.hasPremium) {
            color = chosenMessage?.Color ?? color;
        }

        if (chosenMessage.Embed) {
            msgOptions.embeds = [new MessageEmbed().setDescription(customMessage).setColor(color)];
        } else {
            if (msgOptions.content === undefined) msgOptions.content = customMessage;
            else msgOptions.content += `\n${customMessage}`;
        }
        await InteractionUtils.send(intr, msgOptions);
    }
}
