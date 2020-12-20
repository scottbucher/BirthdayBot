import { MessageUtils } from '../../utils';
import {
    CollectOptions,
    CollectorUtils,
    ExpireFunction,
    MessageFilter,
} from 'discord.js-collector-utils';
import { Message, MessageEmbed, MessageReaction, TextChannel, User } from 'discord.js';

import { BlacklistRepo } from '../../services/database/repos';

let Config = require('../../../config/config.json');

const COLLECT_OPTIONS: CollectOptions = {
    time: Config.experience.promptExpireTime * 1000,
    reset: true,
};

export class BlacklistClearSubCommand {
    constructor(private blacklistRepo: BlacklistRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel) {
        let stopFilter: MessageFilter = (nextMsg: Message) =>
            nextMsg.author.id === msg.author.id &&
            [Config.prefix, ...Config.stopCommands].includes(
                nextMsg.content.split(/\s+/)[0].toLowerCase()
            );
        let expireFunction: ExpireFunction = async () => {
            await MessageUtils.send(
                channel,
                new MessageEmbed()
                    .setTitle('Birthday Message Clear - Expired')
                    .setDescription('Type `bday blacklist clear` to clear the birthday blacklist.')
                    .setColor(Config.colors.error)
            );
        };

        let blacklisted = await this.blacklistRepo.getBlacklist(msg.guild.id);

        let confirmationEmbed = new MessageEmbed();

        if (blacklisted.blacklist.length === 0) {
            confirmationEmbed
                .setDescription('You server has not blacklisted any users!')
                .setColor(Config.colors.error);
            await MessageUtils.send(channel, confirmationEmbed);
            return;
        }

        let trueFalseOptions = [Config.emotes.confirm, Config.emotes.deny];

        confirmationEmbed
            .setDescription(
                `Are you sure you want to clear __**${
                    blacklisted.blacklist.length
                }**__ blacklisted user${blacklisted.blacklist.length === 1 ? '' : 's'}?`
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

        MessageUtils.delete(confirmationMessage);

        if (confirmation === undefined) return;

        if (confirmation === Config.emotes.confirm) {
            // Confirm
            await this.blacklistRepo.clearBlacklist(msg.guild.id);

            let embed = new MessageEmbed()
                .setDescription(`Successfully cleared the birthday blacklist!`)
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
