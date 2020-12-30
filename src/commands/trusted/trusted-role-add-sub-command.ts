import { Message, MessageEmbed, Role, TextChannel } from 'discord.js';

import { MessageUtils } from '../../utils';
import { TrustedRoleRepo } from '../../services/database/repos/trusted-role-repo';

let Config = require('../../../config/config.json');

const errorEmbed = new MessageEmbed()
    .setTitle('Invalid Usage!')
    .setDescription(`Please specify a role!`)
    .setColor(Config.colors.error);

export class TrustedRoleAddSubCommand {
    constructor(private trustedRoleRepo: TrustedRoleRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel, hasPremium: boolean) {
        if (args.length === 3) {
            await MessageUtils.send(channel, errorEmbed);
            return;
        }
        // See if a role was specified
        let trustedRole: Role = msg.mentions.roles.first();

        if (!trustedRole) {
            trustedRole = msg.guild.roles.cache.find(
                role =>
                    role.name.toLowerCase().includes(args[3].toLowerCase()) ||
                    role.id === args[3].toLowerCase()
            );
        }

        if (
            !trustedRole ||
            trustedRole.id === msg.guild.id ||
            args[3].toLowerCase() === 'everyone'
        ) {
            let embed = new MessageEmbed()
                .setDescription(`Invalid Role!`)
                .setColor(Config.colors.error);
            MessageUtils.send(channel, embed);
            return;
        }

        if (trustedRole.managed) {
            let embed = new MessageEmbed()
                .setDescription(`Trusted Role cannot be managed by an external service!`)
                .setColor(Config.colors.error);
            MessageUtils.send(channel, embed);
            return;
        }

        let trustedRoles = await this.trustedRoleRepo.getTrustedRoles(msg.guild.id);

        if (
            trustedRoles &&
            trustedRoles.trustedRoles.length >= Config.validation.trustedRoles.maxCount.free &&
            !hasPremium
        ) {
            let embed = new MessageEmbed()
                .setDescription(`Your server is limited to one trusted role!`)
                .setFooter(
                    `To have up to ${Config.validation.trustedRoles.maxCount.paid.toLocaleString()} trusted roles get Birthday Bot Premium!`,
                    msg.client.user.avatarURL()
                )
                .setColor(Config.colors.error);
            await MessageUtils.send(channel, embed);
            return;
        } else if (
            trustedRoles &&
            trustedRoles.trustedRoles.length >= Config.validation.message.maxCount.birthday.paid
        ) {
            let embed = new MessageEmbed()
                .setDescription(
                    `Your server has reached the maximum trusted roles! (${Config.validation.message.maxCount.birthday.paid.toLocaleString()})`
                )
                .setColor(Config.colors.error);
            await MessageUtils.send(channel, embed);
            return;
        }

        if (trustedRoles.trustedRoles.find(role => role.TrustedRoleDiscordId === trustedRole.id)) {
            let embed = new MessageEmbed()
                .setDescription(`${trustedRole.toString()} is already a trusted role!`)
                .setColor(Config.colors.error);
            await MessageUtils.send(channel, embed);
            return;
        }

        await this.trustedRoleRepo.addTrustedRole(msg.guild.id, trustedRole?.id);

        let embed = new MessageEmbed()
            .setDescription(`Successfully added ${trustedRole.toString()} as a trusted role!`)
            .setColor(Config.colors.success);
        await MessageUtils.send(channel, embed);
    }
}
