import { CustomMessage, CustomMessages } from '../../models/database';
import { Message, MessageEmbed, TextChannel } from 'discord.js';

import { CustomMessageRepo } from '../../services/database/repos';
import { MessageUtils } from '../../utils';
import { Lang } from '../../services';
import { LangCode } from '../../models/enums';

let Config = require('../../../config/config.json');

export class MessageRemoveSubCommand {
    constructor(private customMessageRepo: CustomMessageRepo) { }

    public async execute(args: string[], msg: Message, channel: TextChannel) {
        let type = args[3]?.toLowerCase();

        if (
            !type ||
            (type !== 'birthday' && type !== 'memberanniversary' && type !== 'serveranniversary')
        ) {
            await MessageUtils.send(channel, Lang.getEmbed('validation.removeMessageInvalidType', LangCode.EN));
            return;
        }

        if (args.length < 5) {
            await MessageUtils.send(channel, Lang.getEmbed('validation.noMessageNumer', LangCode.EN));
            return;
        }

        // Try and find someone they are mentioning
        let target = msg.mentions.members.first()?.user;

        // Try and get the position
        let position: number;

        // Retrieve message to remove
        let customMessages = await this.customMessageRepo.getCustomMessages(msg.guild.id, type);
        let userMessages: CustomMessages;

        if (type === 'birthday') {
            if (target) {
                userMessages = await this.customMessageRepo.getCustomUserMessages(
                    msg.guild.id,
                    type
                );

                if (!userMessages) {
                    await MessageUtils.send(channel, Lang.getEmbed('validation.noUserSpecificBirthdayMessages', LangCode.EN));
                    return;
                }

                let userMessage = userMessages.customMessages.filter(
                    message => message.UserDiscordId === target.id
                );

                if (userMessage.length > 0) position = userMessage[0].Position;
            }
        }

        if (!position) {
            try {
                position = parseInt(args[4]);
            } catch (error) {
                await MessageUtils.send(channel, Lang.getEmbed('validation.customMessageInvalidPosition', LangCode.EN));
                return;
            }
        }

        if (!position) {
            await MessageUtils.send(channel, Lang.getEmbed('validiation.customMessageInvalidMessageNumber', LangCode.EN));
            return;
        }

        let message: CustomMessage;

        // find the position based on if it is a user or global message
        target
            ? (message = userMessages.customMessages.find(
                question => question.Position === position
            ))
            : (message = customMessages.customMessages.find(
                question => question.Position === position
            ));

        if (!message) {
            await MessageUtils.send(channel, Lang.getEmbed('validiation.customMessageInvalidMessageNumber', LangCode.EN));
            return;
        }

        // Remove the question base on if it is a user or global message
        target
            ? await this.customMessageRepo.removeCustomMessageUser(msg.guild.id, position, type)
            : await this.customMessageRepo.removeCustomMessage(msg.guild.id, position, type);

        await MessageUtils.send(channel, Lang.getEmbed('results.removeMessage', LangCode.EN, { MESSAGE: message.Message }));
    }
}
