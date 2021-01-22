import { Message, MessageEmbed, Role, TextChannel } from 'discord.js';

import { GuildRepo } from '../../services/database/repos';
import { MessageUtils } from '../../utils';

let Config = require('../../../config/config.json');

export class MessageMentionSubCommand {
    constructor(private guildRepo: GuildRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel): Promise<void> {
        if (args.length < 4) {
            let embed = new MessageEmbed()
                .setDescription(
                    'Please provide a value!\nAccepted Values: `everyone`, `here`, `@role/role-name`, `none`'
                )
                .setColor(Config.colors.error);
            await MessageUtils.send(channel, embed);
            return;
        }

        let mention: string;

        // Find mentioned role
        let roleInput: Role = msg.mentions.roles.first();

        if (!roleInput) {
            roleInput = msg.guild.roles.cache.find(role =>
                role.name.toLowerCase().includes(args[3].toLowerCase())
            );
        }

        if (!roleInput || roleInput.guild.id !== msg.guild.id) {
            // if there is no roles then check for other accepted values
            if (
                args[3].toLowerCase() !== 'everyone' &&
                args[3].toLowerCase() !== 'here' &&
                args[3].toLowerCase() !== '@here' &&
                args[3].toLowerCase() !== 'none'
            ) {
                let embed = new MessageEmbed()
                    .setTitle('Invalid Group/Role')
                    .setDescription(
                        'Accepted Values: `everyone`, `here`, `@role/role-name`, `none`'
                    )
                    .setTimestamp()
                    .setColor(Config.colors.error);
                await MessageUtils.send(channel, embed);
                return;
            } else {
                if (args[3].toLowerCase() === '@here') {
                    // Support for the @here input
                    mention = `here`;
                } else {
                    mention = args[3]; // Else it is either here, everyone, or none
                }
            }
        } else {
            mention = roleInput?.id; // If roleInput does exists then get the role Id
        }

        let mentionOutput: string;

        if (!roleInput || roleInput.guild.id !== msg.guild.id) {
            if (mention.toLowerCase() === 'everyone' || mention.toLowerCase() === 'here') {
                mentionOutput = '@' + mention;
            } else if (mention.toLowerCase() === 'none') {
                mentionOutput = `no one`;
            }
        } else {
            mentionOutput = roleInput.toString();
        }

        let embed = new MessageEmbed()
            .setDescription(
                `${msg.client.user.toString()} will now mention ${mentionOutput} with the birthday message!`
            )
            .setColor(Config.colors.success);

        if (mention === 'none') mention = '0';

        await this.guildRepo.updateMentionSetting(msg.guild.id, mention);

        await MessageUtils.send(channel, embed);
    }
}
