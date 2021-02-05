import { Message, MessageEmbed, Role, TextChannel } from 'discord.js';

import { GuildRepo } from '../../services/database/repos';
import { Lang } from '../../services';
import { LangCode } from '../../models/enums';
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
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.invalidMessageType', LangCode.EN_US)
            );
            return;
        }

        if (args.length < 5) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.invalidMention', LangCode.EN_US)
            );
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
                await MessageUtils.send(
                    channel,
                    Lang.getEmbed('validation.invalidMentionSetting', LangCode.EN_US)
                );
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
                mentionOutput = Lang.getRef('terms.noOne', LangCode.EN_US);
            }
        } else {
            mentionOutput = roleInput.toString();
        }

        if (type === 'birthday') {
            if (mention === 'none') mention = '0';

            await this.guildRepo.updateBirthdayMentionSetting(msg.guild.id, mention);
            await MessageUtils.send(
                channel,
                Lang.getEmbed('results.setBirthdayMessageMention', LangCode.EN_US, {
                    MENTION: mentionOutput,
                })
            );
        } else if (type === 'memberanniversary') {
            if (mention === 'none') mention = '0';

            await this.guildRepo.updateMemberAnniversaryMentionSetting(msg.guild.id, mention);
            await MessageUtils.send(
                channel,
                Lang.getEmbed('results.setMemberAnniversaryMessageMention', LangCode.EN_US, {
                    MENTION: mentionOutput,
                })
            );
        } else if (type === 'serveranniversary') {
            if (mention === 'none') mention = '0';

            await this.guildRepo.updateServerAnniversaryMentionSetting(msg.guild.id, mention);
            await MessageUtils.send(
                channel,
                Lang.getEmbed('results.setServerAnniversaryMessageMention', LangCode.EN_US, {
                    MENTION: mentionOutput,
                })
            );
        }
    }
}
