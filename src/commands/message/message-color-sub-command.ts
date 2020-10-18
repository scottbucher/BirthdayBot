import { ActionUtils, MessageUtils } from '../../utils';
import {
    CollectOptions,
    CollectorUtils,
    ExpireFunction,
    MessageFilter,
} from 'discord.js-collector-utils';
import { Message, MessageEmbed, MessageReaction, TextChannel, User } from 'discord.js';

import { ColorUtils } from '../../utils/color-utils';
import { GuildRepo } from '../../services/database/repos';

let Config = require('../../../config/config.json');

const COLLECT_OPTIONS: CollectOptions = {
    time: Config.experience.promptExpireTime * 1000,
    reset: true,
};

export class MessageColorSubCommand {
    constructor(private guildRepo: GuildRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel) {
        let stopFilter: MessageFilter = (nextMsg: Message) =>
            nextMsg.author.id === msg.author.id &&
            [Config.prefix, ...Config.stopCommands].includes(
                nextMsg.content.split(/\s+/)[0].toLowerCase()
            );
        let expireFunction: ExpireFunction = async () => {
            await channel.send(
                new MessageEmbed()
                    .setTitle('Birthday Message Color Selection - Expired')
                    .setDescription(
                        'Type `bday message color` to set a custom birthday message color.'
                    )
                    .setColor(Config.colors.error)
            );
        };
        let colorHex: string;

        if (args.length < 4) {
            let colorOptionsText = '';
            for (const [colorName, colorEmoji] of Object.entries(Config.emotes.colors)) {
                colorOptionsText += `${colorEmoji} ${
                    colorName.charAt(0).toUpperCase() + colorName.slice(1)
                }\n`;
            }
            colorOptionsText += `${Config.emotes.custom} Custom Color`;

            let colorEmbed = new MessageEmbed()
                .setAuthor(`${msg.guild.name}`, msg.guild.iconURL())
                .setTitle('Birthday Message Color Selection')
                .setDescription(
                    `Please select a color or input a custom one. [(?)](${Config.links.docs}/faq#)`
                )
                .addField(colorOptionsText, '\u200b')
                .setFooter(`This message expires in 2 minutes!`, msg.client.user.avatarURL())
                .setColor(Config.colors.default)
                .setTimestamp();

            let colorMessage = await channel.send(colorEmbed); // Send confirmation and emotes

            let emotes = [...Object.values(Config.emotes.colors), Config.emotes.custom];
            for (let emote of emotes) {
                await colorMessage.react(emote);
            }

            let colorChoice: string = await CollectorUtils.collectByReaction(
                colorMessage,
                // Collect Filter
                (msgReaction: MessageReaction, reactor: User) =>
                    reactor.id === msg.author.id && emotes.includes(msgReaction.emoji.name),
                stopFilter,
                // Retrieve Result
                async (msgReaction: MessageReaction, reactor: User) => {
                    return msgReaction.emoji.name;
                },
                expireFunction,
                COLLECT_OPTIONS
            );

            ActionUtils.deleteMessage(colorMessage);

            if (colorChoice === undefined) return;

            for (const [colorName, colorEmoji] of Object.entries(Config.emotes.colors)) {
                if (colorChoice === colorEmoji) {
                    colorHex = ColorUtils.findHex(colorName);
                    break;
                }
            }

            if (colorChoice === Config.emotes.custom) {
                let inputColorEmbed = new MessageEmbed()
                    .setDescription(
                        `Please input what color you would like! (name, hex code, etc.)`
                    )
                    .setFooter(`This message expires in 2 minutes!`, msg.client.user.avatarURL())
                    .setColor(Config.colors.default)
                    .setTimestamp();

                let selectMessage = await channel.send(inputColorEmbed);

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

                ActionUtils.deleteMessage(selectMessage);

                if (colorHex === undefined) {
                    return;
                }
            }
        } else {
            colorHex = ColorUtils.findHex(args[3]);
        }

        if (!colorHex) {
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

        let colorName = ColorUtils.findName(colorHex);

        let embed = new MessageEmbed()
            .setDescription(
                `${msg.client.user.toString()} will now use the hex color **#${
                    colorName ? `${colorHex} (${colorName})` : colorHex
                }** in birthday messages!` +
                    `\n\nHint: You can see an example of the color on the left side of this embed!`
            )
            .setColor(colorHex);

        await this.guildRepo.updateMessageEmbedColor(msg.guild.id, colorHex);

        await MessageUtils.send(channel, embed);
    }
}
