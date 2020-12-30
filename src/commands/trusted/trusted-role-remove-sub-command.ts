import { Message, MessageEmbed, Role, TextChannel } from 'discord.js';

import { MessageUtils } from '../../utils';
import { TrustedRole } from '../../models/database';
import { TrustedRoleRepo } from '../../services/database/repos/trusted-role-repo';

let Config = require('../../../config/config.json');

const errorEmbed = new MessageEmbed()
    .setTitle('Invalid Usage!')
    .setDescription(`Please specify a position or role to remove!`)
    .setColor(Config.colors.error);

export class TrustedRoleRemoveSubCommand {
    constructor(private trustedRoleRepo: TrustedRoleRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel) {
        // See if a role was specified
        let trustedRole: Role = msg.mentions.roles.first();
        let position: number;

        if (!trustedRole) {
            trustedRole = msg.guild.roles.cache.find(
                role =>
                    role.name.toLowerCase().includes(args[3].toLowerCase()) ||
                    role.id === args[3].toLowerCase()
            );
        }

        if (
            trustedRole &&
            (trustedRole.id === msg.guild.id || args[3].toLowerCase() === 'everyone')
        ) {
            let embed = new MessageEmbed()
                .setDescription(`Invalid Role!`)
                .setColor(Config.colors.error);
            MessageUtils.send(channel, embed);
            return;
        }

        let trustedRoles = await this.trustedRoleRepo.getTrustedRoles(msg.guild.id);

        if (trustedRole) {
            let role = trustedRoles.trustedRoles.filter(
                r => r.TrustedRoleDiscordId === trustedRole.id
            );

            if (role.length > 0) position = role[0].Position;
        }

        if (!position) {
            try {
                position = parseInt(args[3]);
            } catch (error) {
                let embed = new MessageEmbed()
                    .setTitle('Invalid position!')
                    .setDescription(
                        `Use \`bday trustedRole list <type>\` to view your server's trusted roles!`
                    )
                    .setColor(Config.colors.error);
                await MessageUtils.send(channel, embed);
                return;
            }
        }

        if (!position) {
            let embed = new MessageEmbed()
                .setTitle('Remove Trusted Role')
                .setDescription(
                    `Trusted Role does not exist!\nView your server's trusted roles with \`bday trustedRole list\`!`
                )
                .setFooter(`${Config.emotes.deny} Action Failed.`, msg.client.user.avatarURL())
                .setColor(Config.colors.error);
            await MessageUtils.send(channel, embed);
            return;
        }

        let role: TrustedRole;

        role = trustedRoles.trustedRoles.find(r => r.Position === position);

        if (!role) {
            let embed = new MessageEmbed()
                .setTitle('Remove Trusted Role')
                .setDescription(
                    `Trusted Role does not exist!\nView your server's trusted roles with \`bday trustedRole list\`!`
                )
                .setFooter(`${Config.emotes.deny} Action Failed.`, msg.client.user.avatarURL())
                .setColor(Config.colors.error);
            await MessageUtils.send(channel, embed);
            return;
        }

        await this.trustedRoleRepo.removeTrustedRole(msg.guild.id, position);

        let r = msg.guild.roles.resolve(role.TrustedRoleDiscordId);

        let embed = new MessageEmbed()
            .setTitle('Remove Trusted Role')
            .setDescription(r ? r.toString() : '**Deleted Role**')
            .setFooter(
                `${Config.emotes.confirm} Trusted Role removed.`,
                msg.client.user.avatarURL()
            )
            .setTimestamp()
            .setColor(Config.colors.success);
        await MessageUtils.send(channel, embed);
    }
}
