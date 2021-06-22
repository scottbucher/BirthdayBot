import { DMChannel, MessageEmbed, Role, TextChannel, User } from 'discord.js';

import { MessageUtils } from '.';
import { deprecate } from 'util';
import { Lang } from '../services';
import { LangCode } from '../models/enums';

let Config = require('../../config/config.json');

export class InvalidUtils {
    public static async notEnoughPermissions(
        target: User | DMChannel | TextChannel,
        permissions: string[]
    ): Promise<void> {
        let permList = permissions.map(perm => `\`${perm}\``).join('\n');
        let embed = new MessageEmbed()
            .setTitle('Not Enough Permissions!')
            .setColor(Config.colors.error)
            .setDescription(
                'Birthday Bot does not have enough permission to perform this action.' +
                `\n\nNeeded Permission${
                permissions.length > 1 ? 's' : ''
                } (In the server and channel!):` +
                `\n${permList}`
            )
            .setFooter(
                'Please join our support server if you have any questions.',
                target.client.user.avatarURL()
            );
        await MessageUtils.send(target, embed);
    }

    public static async cantSendInChannel(
        target: User | DMChannel | TextChannel,
        issueChannel: User | DMChannel | TextChannel,
        permissions: string[]
    ): Promise<void> {
        let permList = permissions.map(perm => `\`${perm}\``).join('\n');
        let embed = new MessageEmbed()
            .setTitle('Not Enough Permissions!')
            .setColor(Config.colors.error)
            .setDescription(
                `Birthday Bot does not have enough permission in ${issueChannel.toString()} to preform this action.` +
                `\n\nNeeded Permission${permissions.length > 1 ? 's' : ''}:` +
                `\n${permList}`
            )
            .setFooter(
                'Please join our support server if you have any questions.',
                target.client.user.avatarURL()
            );
        await MessageUtils.send(target, embed);
    }
}
