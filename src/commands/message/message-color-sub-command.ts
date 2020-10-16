import {
    CollectOptions,
    CollectorUtils,
    ExpireFunction,
    MessageFilter,
} from 'discord.js-collector-utils';
import { Message, MessageEmbed, MessageReaction, TextChannel, User } from 'discord.js';

import { ActionUtils } from '../../utils';
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
        let color: string;

        if (args.length < 4) {
            // What color do they want
            let colorOptions = [
                Config.emotes.colorOptions.red,
                Config.emotes.colorOptions.yellow,
                Config.emotes.colorOptions.blue,
                Config.emotes.colorOptions.green,
                Config.emotes.colorOptions.orange,
                Config.emotes.colorOptions.purple,
                Config.emotes.colorOptions.black,
                Config.emotes.colorOptions.custom,
            ];

            let colorEmbed = new MessageEmbed()
                .setAuthor(`${msg.guild.name}`, msg.guild.iconURL())
                .setTitle('Birthday Message Color Selection')
                .setDescription(
                    `Please select a color or to input a custom one. [(?)](${Config.links.docs}/faq#)`
                )
                .addField(
                    `${Config.emotes.colorOptions.red} Red\n${Config.emotes.colorOptions.yellow} Yellow\n${Config.emotes.colorOptions.blue} Blue\n${Config.emotes.colorOptions.green} Green\n${Config.emotes.colorOptions.orange} Orange\n${Config.emotes.colorOptions.purple} Purple\n${Config.emotes.colorOptions.black} Black\n${Config.emotes.colorOptions.custom} Custom Color\n`,
                    '\u200b'
                )
                .setFooter(`This message expires in 2 minutes!`, msg.client.user.avatarURL())
                .setColor(Config.colors.default)
                .setTimestamp();

            let colorMessage = await channel.send(colorEmbed); // Send confirmation and emotes
            for (let option of colorOptions) {
                await colorMessage.react(option);
            }

            let colorChoice: string = await CollectorUtils.collectByReaction(
                colorMessage,
                // Collect Filter
                (msgReaction: MessageReaction, reactor: User) =>
                    reactor.id === msg.author.id && colorOptions.includes(msgReaction.emoji.name),
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

            // set the color value
            switch (colorChoice) {
                case Config.emotes.colorOptions.red:
                    color = ColorUtils.findHex('red');
                    break;
                case Config.emotes.colorOptions.yellow:
                    color = ColorUtils.findHex('yellow');
                    break;
                case Config.emotes.colorOptions.blue:
                    color = ColorUtils.findHex('blue');
                    break;
                case Config.emotes.colorOptions.green:
                    color = ColorUtils.findHex('green');
                    break;
                case Config.emotes.colorOptions.orange:
                    color = ColorUtils.findHex('orange');
                    break;
                case Config.emotes.colorOptions.purple:
                    color = ColorUtils.findHex('purple');
                    break;
                case Config.emotes.colorOptions.black:
                    color = ColorUtils.findHex('black');
                    break;
                case Config.emotes.colorOptions.custom:
                    let inputColorEmbed = new MessageEmbed()
                        .setDescription(
                            `Please input what color you would like! (name, hex code, etc.)`
                        )
                        .setFooter(
                            `This message expires in 2 minutes!`,
                            msg.client.user.avatarURL()
                        )
                        .setColor(Config.colors.default)
                        .setTimestamp();

                    let selectMessage = await channel.send(inputColorEmbed);

                    color = await CollectorUtils.collectByMessage(
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
                                await channel.send(embed);
                                return;
                            }

                            return check;
                        },
                        expireFunction,
                        COLLECT_OPTIONS
                    );

                    ActionUtils.deleteMessage(selectMessage);

                    if (color === undefined) {
                        return;
                    }
                    break;
            }
        } else {
            color = ColorUtils.findHex(args[3]);
        }

        if (!color) {
            let embed = new MessageEmbed()
                .setTitle('Invalid Color')
                .setDescription(
                    `Please provide a valid hex color! Find hex colors [here](${Config.links.colors}).` +
                        '\n\nExample: `Orange` or `Crimson`' +
                        '\nExample: `#4EEFFF` or `4EEFFF`'
                )
                .setTimestamp()
                .setColor(Config.colors.error);
            await channel.send(embed);
            return;
        }

        let embed = new MessageEmbed()
            .setDescription(
                `${msg.client.user.toString()} will now use the hex color **#${color}** in birthday messages!` +
                    `\n\nHint: You can see an example of the color on the left side of this embed!`
            )
            .setColor(color);

        await this.guildRepo.updateMessageEmbedColor(msg.guild.id, color);

        await channel.send(embed);
    }
}
