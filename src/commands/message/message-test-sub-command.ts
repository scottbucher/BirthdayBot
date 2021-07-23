import { CelebrationUtils, FormatUtils, MessageUtils, ParseUtils } from '../../utils';
import { CustomMessageRepo, GuildRepo } from '../../services/database/repos';
import { GuildMember, Message, MessageEmbed, TextChannel } from 'discord.js';

import { Lang } from '../../services';
import { LangCode } from '../../models/enums';
import moment from 'moment';

let Config = require('../../../config/config.json');

export class MessageTestSubCommand {
    constructor(private guildRepo: GuildRepo, private customMessageRepo: CustomMessageRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel): Promise<void> {
        // bday message test <type> <position> [user count]
        let type = FormatUtils.extractCelebrationType(args[3]?.toLowerCase())?.toLowerCase();

        if (
            !type ||
            (type !== 'birthday' && type !== 'memberanniversary' && type !== 'serveranniversary')
        ) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.invalidMessageType', LangCode.EN_US, {
                    ICON: msg.client.user.displayAvatarURL(),
                })
            );
            return;
        }

        let userCount = 1;

        if (args.length < 5) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.noMessageNumber', LangCode.EN_US)
            );
            return;
        } else if (args.length >= 6) {
            userCount = ParseUtils.parseInt(args[5]);
        }
        // Try and find someone they are mentioning
        let target = msg.mentions.members.first();
        let position: number;

        if (!target) {
            userCount = userCount > 5 ? 5 : userCount;

            // Try and get the position
            position = ParseUtils.parseInt(args[4]);

            if (position === undefined || position === null) {
                await MessageUtils.send(
                    channel,
                    Lang.getEmbed('validation.invalidMessageNumber', LangCode.EN_US)
                );
                return;
            }
        } else {
            userCount = 1;
        }

        let botMember = msg.guild.members.resolve(msg.client.user);

        let memberList: GuildMember[] = [];

        for (let i = 0; i < userCount; i++) {
            memberList.push(target ? target : botMember);
        }

        let guildData = await this.guildRepo.getGuild(msg.guild.id);

        let userList = CelebrationUtils.getUserListString(guildData, memberList);

        // Retrieve message to remove
        let messages = target
            ? await this.customMessageRepo.getCustomUserMessages(msg.guild.id, type)
            : await this.customMessageRepo.getCustomMessages(msg.guild.id, type);

        let year =
            type === 'memberanniversary'
                ? moment().diff(
                      target
                          ? target.joinedAt
                          : msg.guild.members.resolve(msg.client.user).joinedAt,
                      'years'
                  ) + 1
                : type === 'serveranniversary'
                ? moment().diff(msg.guild.createdAt, 'years') + 1
                : null;

        if (messages.customMessages.length === 0 || position === 0) {
            let defaultMessage =
                type === 'memberanniversary'
                    ? Lang.getRef('defaults.memberAnniversaryMessage', LangCode.EN_US)
                    : type === 'serveranniversary'
                    ? Lang.getRef('defaults.serverAnniversaryMessage', LangCode.EN_US)
                    : Lang.getRef('defaults.birthdayMessage', LangCode.EN_US);

            await MessageUtils.send(
                channel,
                new MessageEmbed()
                    .setDescription(
                        CelebrationUtils.replacePlaceHolders(
                            defaultMessage,
                            msg.guild,
                            type,
                            userList,
                            year
                        )
                    )
                    .setColor(Config.colors.default)
            );
            return;
        }

        let chosenMessage = target
            ? messages.customMessages.find(message => message.UserDiscordId === target.id)
            : messages.customMessages.find(message => message.Position === position);

        let customMessage = CelebrationUtils.replacePlaceHolders(
            chosenMessage?.Message,
            msg.guild,
            type,
            userList,
            year
        );

        if (!customMessage) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.messageDoesNotExist', LangCode.EN_US, {
                    ICON: msg.client.user.displayAvatarURL(),
                })
            );
            return;
        }

        if (chosenMessage.Embed) {
            let embed = new MessageEmbed()
                .setDescription(customMessage)
                .setColor(Config.colors.default);
            await MessageUtils.send(channel, embed);
        } else {
            await MessageUtils.send(channel, customMessage);
        }
    }
}
