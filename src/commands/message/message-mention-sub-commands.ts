import { Message, MessageEmbed, Role, TextChannel } from 'discord.js';

import { GuildRepo } from '../../services/database/repos';
import { MessageUtils } from '../../utils';

let Config = require('../../../config/config.json');

export class MessageMentionSubCommand {
    constructor(private guildRepo: GuildRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel): Promise<void> {
        //bday message mention <type> <role>
        let type = args[3]?.toLowerCase();

        if (
            !type ||
            (type !== 'birthday' && type !== 'memberanniversary' && type !== 'serveranniversary')
        ) {
            let embed = new MessageEmbed()
                .setDescription('Please provide a message type! -- replace with LANG')
                .setColor(Config.colors.error);
            await MessageUtils.send(channel, embed);
            return;
        }

        if (args.length < 5) {
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
                role.name.toLowerCase().includes(args[4].toLowerCase())
            );
        }

        if (!roleInput || roleInput.guild.id !== msg.guild.id) {
            // if there is no roles then check for other accepted values
            if (
                args[4].toLowerCase() !== 'everyone' &&
                args[4].toLowerCase() !== 'here' &&
                args[4].toLowerCase() !== '@here' &&
                args[4].toLowerCase() !== 'none'
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
                if (args[4].toLowerCase() === '@here') {
                    // Support for the @here input
                    mention = `here`;
                } else {
                    mention = args[4]; // Else it is either here, everyone, or none
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

        if (type === 'birthday') {
            let embed = new MessageEmbed()
                .setDescription(
                    `${msg.client.user.toString()} will now mention ${mentionOutput} with the birthday message!`
                )
                .setColor(Config.colors.success);
            await MessageUtils.send(channel, embed);

            if (mention === 'none') mention = '0';

            await this.guildRepo.updateBirthdayMentionSetting(msg.guild.id, mention);
        } else if (type === 'memberanniversary') {
            let embed = new MessageEmbed()
                .setDescription(
                    `${msg.client.user.toString()} will now mention ${mentionOutput} with the member anniversary message!`
                )
                .setColor(Config.colors.success);
            await MessageUtils.send(channel, embed);

            if (mention === 'none') mention = '0';

            await this.guildRepo.updateMemberAnniversaryMentionSetting(msg.guild.id, mention);
        } else if (type === 'serveranniversary') {
            let embed = new MessageEmbed()
                .setDescription(
                    `${msg.client.user.toString()} will now mention ${mentionOutput} with the server anniversary message!`
                )
                .setColor(Config.colors.success);
            await MessageUtils.send(channel, embed);

            if (mention === 'none') mention = '0';

            await this.guildRepo.updateServerAnniversaryMentionSetting(msg.guild.id, mention);
        }
    }
}
