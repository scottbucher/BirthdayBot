import { DMChannel, MessageEmbed, Role, TextChannel, User } from 'discord.js';

import { MessageUtils } from './message-utils';

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

    public static async roleHierarchyError(
        target: User | DMChannel | TextChannel,
        role: Role
    ): Promise<void> {
        let embed = new MessageEmbed()
            .setTitle('Role Hierarchy Error!')
            .setColor(Config.colors.error)
            .setDescription(
                `The birthday role must be below ${target.client.user.toString()}'s role.` +
                    `\nAdditional Note: ${target.client.user.toString()}'s role must be higher than the users it is assigning the birthday role to.` +
                    `\n\nExample Role Hierarchy:\n\`Birthday Bot's Role\`\n\`Birthday Role\`\n\`Birthday User's Highest Role\`` +
                    `\n\nEssentially the bot is unable to give a role to someone with a higher role than them or give a role that is higher than the bot's.`
            )
            .setFooter(
                'Please join our support server if you have any questions.',
                target.client.user.avatarURL()
            );
        await MessageUtils.send(target, embed);
    }
}
