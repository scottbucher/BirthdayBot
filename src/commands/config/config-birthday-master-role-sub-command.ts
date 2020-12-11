import { InvalidUtils, MessageUtils, PermissionUtils } from '../../utils';
import { Message, MessageEmbed, Role, TextChannel } from 'discord.js';

import { GuildRepo } from '../../services/database/repos';

let Config = require('../../../config/config.json');

const errorEmbed = new MessageEmbed()
    .setTitle('Invalid Usage!')
    .setDescription(
        `Please specify an option!\n\n\`bday config birthdayMasterRole create\` - Creates the default birthday master role.\n\`bday config birthdayMasterRole clear\` - Clears the birthday master role.\n\`bday config birthdayMasterRole @role\` - Set the birthday master role.`
    )
    .setColor(Config.colors.error);

export class ConfigBirthdayMasterRoleSubCommand {
    constructor(private guildRepo: GuildRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel) {
        if (args.length === 3) {
            await MessageUtils.send(channel, errorEmbed);
            return;
        }

        if (args[3].toLowerCase() === 'create') {
            // User wants to create the default birthday master role
            if (!msg.guild.me.hasPermission('MANAGE_ROLES')) {
                await InvalidUtils.notEnoughPermissions(msg.channel as TextChannel, [
                    'MANAGE_ROLES',
                ]);
                return;
            }

            // Create role with desired attributes
            let birthdayMasterRole = await msg.guild.roles.create({
                data: {
                    name: 'BirthdayMaster',
                },
            });

            await this.guildRepo.updateBirthdayMasterRole(msg.guild.id, birthdayMasterRole?.id);

            let embed = new MessageEmbed()
                .setDescription(
                    `Successfully created the birthday master role ${birthdayMasterRole.toString()}!`
                )
                .setColor(Config.colors.success);
            await MessageUtils.send(channel, embed);
        } else if (args[3].toLowerCase() === 'clear') {
            // User wants to clear the birthday master role
            await this.guildRepo.updateBirthdayMasterRole(msg.guild.id, '0');

            let embed = new MessageEmbed()
                .setDescription(`Successfully cleared the birthday master role!`)
                .setColor(Config.colors.success);
            await MessageUtils.send(channel, embed);
        } else {
            // See if a role was specified
            let birthdayMasterRole: Role = msg.mentions.roles.first();

            if (!birthdayMasterRole) {
                birthdayMasterRole = msg.guild.roles.cache.find(role =>
                    role.name.toLowerCase().includes(args[3].toLowerCase())
                );
            }

            if (
                !birthdayMasterRole ||
                birthdayMasterRole.id === msg.guild.id ||
                args[3].toLowerCase() === 'everyone'
            ) {
                let embed = new MessageEmbed()
                    .setDescription(`Invalid Role!`)
                    .setColor(Config.colors.error);
                MessageUtils.send(channel, embed);
                return;
            }

            if (birthdayMasterRole.managed) {
                let embed = new MessageEmbed()
                    .setDescription(
                        `Birthday Master Role cannot be managed by an external service!`
                    )
                    .setColor(Config.colors.error);
                MessageUtils.send(channel, embed);
                return;
            }

            await this.guildRepo.updateBirthdayMasterRole(msg.guild.id, birthdayMasterRole?.id);

            let embed = new MessageEmbed()
                .setDescription(
                    `Successfully set the birthday master role to ${birthdayMasterRole.toString()}!`
                )
                .setColor(Config.colors.success);
            await MessageUtils.send(channel, embed);
        }
    }
}
