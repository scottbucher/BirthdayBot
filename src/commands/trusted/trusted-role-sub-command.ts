import { InvalidUtils, MessageUtils, PermissionUtils } from '../../utils';
import { Message, MessageEmbed, Role, TextChannel } from 'discord.js';

import { GuildRepo } from '../../services/database/repos';

let Config = require('../../../config/config.json');

const errorEmbed = new MessageEmbed()
    .setTitle('Invalid Usage!')
    .setDescription(
        `Please specify an option!\n\n\`bday trusted role create\` - Creates the default trusted role.\n\`bday trusted role clear\` - Clears the trusted role.\n\`bday config trusted @role\` - Set the trusted role.`
    )
    .setColor(Config.colors.error);

export class TrustedRoleSubCommand {
    constructor(private guildRepo: GuildRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel) {
        if (args.length === 3) {
            await MessageUtils.send(channel, errorEmbed);
            return;
        }

        if (args[3].toLowerCase() === 'create') {
            // User wants to create the default trusted role
            if (!msg.guild.me.hasPermission('MANAGE_ROLES')) {
                await InvalidUtils.notEnoughPermissions(msg.channel as TextChannel, [
                    'MANAGE_ROLES',
                ]);
                return;
            }

            // Create role with desired attributes
            let trustedRole = await msg.guild.roles.create({
                data: {
                    name: 'BirthdayTrusted',
                },
            });

            await this.guildRepo.updateTrustedRole(msg.guild.id, trustedRole?.id);

            let embed = new MessageEmbed()
                .setDescription(`Successfully created the trusted role ${trustedRole.toString()}!`)
                .setColor(Config.colors.success);
            await MessageUtils.send(channel, embed);
        } else if (args[3].toLowerCase() === 'clear') {
            // User wants to clear the trusted role
            await this.guildRepo.updateTrustedRole(msg.guild.id, '0');

            let embed = new MessageEmbed()
                .setDescription(`Successfully cleared the trusted role!`)
                .setColor(Config.colors.success);
            await MessageUtils.send(channel, embed);
        } else {
            // See if a role was specified
            let trustedRole: Role = msg.mentions.roles.first();

            if (!trustedRole) {
                trustedRole = msg.guild.roles.cache.find(role =>
                    role.name.toLowerCase().includes(args[3].toLowerCase())
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

            await this.guildRepo.updateTrustedRole(msg.guild.id, trustedRole?.id);

            let embed = new MessageEmbed()
                .setDescription(`Successfully set the trusted role to ${trustedRole.toString()}!`)
                .setColor(Config.colors.success);
            await MessageUtils.send(channel, embed);
        }
    }
}
