import { ActionUtils, MessageUtils } from '../../utils';
import {
    CollectOptions,
    CollectorUtils,
    ExpireFunction,
    MessageFilter,
} from 'discord.js-collector-utils';
import { Message, MessageEmbed, MessageReaction, TextChannel, User } from 'discord.js';

import { CustomMessageRepo } from '../../services/database/repos';

let Config = require('../../../config/config.json');

const COLLECT_OPTIONS: CollectOptions = {
    time: Config.experience.promptExpireTime * 1000,
    reset: true,
};

export class MessageClearSubCommand {
    constructor(private customMessageRepo: CustomMessageRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel) {
        let stopFilter: MessageFilter = (nextMsg: Message) =>
            nextMsg.author.id === msg.author.id &&
            [Config.prefix, ...Config.stopCommands].includes(
                nextMsg.content.split(/\s+/)[0].toLowerCase()
            );
        let expireFunction: ExpireFunction = async () => {
            await MessageUtils.send(channel,
                new MessageEmbed()
                    .setTitle('Birthday Message Clear - Expired')
                    .setDescription('Type `bday message clear` to clear the birthday messages.')
                    .setColor(Config.colors.error)
            );
        };

        let customMessages = await this.customMessageRepo.getCustomMessages(msg.guild.id);

        let confirmationEmbed = new MessageEmbed();

        if (customMessages.customMessages.length === 0) {
            confirmationEmbed
                .setDescription('You server has not set any custom birthday messages!')
                .setColor(Config.colors.error);
            await MessageUtils.send(channel, confirmationEmbed);
            return;
        }

        let trueFalseOptions = [Config.emotes.confirm, Config.emotes.deny];

        confirmationEmbed
            .setDescription(
                `Are you sure you want to clear __**${customMessages.customMessages.length}**__ custom message${customMessages.customMessages.length === 1 ? '' : 's'}?`
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
                reactor.id === msg.author.id && trueFalseOptions.includes(msgReaction.emoji.name),
            stopFilter,
            // Retrieve Result
            async (msgReaction: MessageReaction, reactor: User) => {
                return msgReaction.emoji.name;
            },
            expireFunction,
            COLLECT_OPTIONS
        );

        ActionUtils.deleteMessage(confirmationMessage);

        if (confirmation === undefined) return;

        if (confirmation === Config.emotes.confirm) {
            // Confirm
            await this.customMessageRepo.clearCustomMessages(msg.guild.id);

            let embed = new MessageEmbed()
                .setDescription(`Successfully cleared all birthday messages from the database!`)
                .setColor(Config.colors.success);
            await MessageUtils.send(channel, embed);
        } else {
            let embed = new MessageEmbed()
                .setDescription(`Action canceled.`)
                .setColor(Config.colors.success);
            await MessageUtils.send(channel, embed);
        }
    }
}
