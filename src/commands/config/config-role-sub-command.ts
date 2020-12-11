import { InvalidUtils, MessageUtils, PermissionUtils } from '../../utils';
import { Message, MessageEmbed, Role, TextChannel } from 'discord.js';

import { GuildRepo } from '../../services/database/repos';

let Config = require('../../../config/config.json');

const errorEmbed = new MessageEmbed()
    .setTitle('Invalid Usage!')
    .setDescription(
        `Please specify an option!\n\n\`bday config role create\` - Creates the default birthday role.\n\`bday config role clear\` - Clears the birthday role.\n\`bday config role @role\` - Set the birthday role.`
    )
    .setColor(Config.colors.error);

export class ConfigRoleSubCommand {
    constructor(private guildRepo: GuildRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel) {
        if (args.length === 3) {
            await MessageUtils.send(channel, errorEmbed);
            return;
        }

        if (args[3].toLowerCase() === 'create') {
            // User wants to create the default birthday role
            if (!msg.guild.me.hasPermission('MANAGE_ROLES')) {
                await InvalidUtils.notEnoughPermissions(msg.channel as TextChannel, [
                    'MANAGE_ROLES',
                ]);
                return;
            }

            // Create role with desired attributes
            let birthdayRole = await msg.guild.roles.create({
                data: {
                    name: Config.emotes.birthday,
                    color: Config.colors.role,
                    hoist: true,
                    mentionable: true,
                },
            });

            await this.guildRepo.updateBirthdayRole(msg.guild.id, birthdayRole?.id);

            let embed = new MessageEmbed()
                .setDescription(
                    `Successfully created the birthday role ${birthdayRole.toString()}!`
                )
                .setFooter(`This role is actively removed from those whose birthday it isn't.`)
                .setColor(Config.colors.success);
            await MessageUtils.send(channel, embed);
        } else if (args[3].toLowerCase() === 'clear') {
            // User wants to clear the birthday role
            await this.guildRepo.updateBirthdayRole(msg.guild.id, '0');

            let embed = new MessageEmbed()
                .setDescription(`Successfully cleared the birthday role!`)
                .setColor(Config.colors.success);
            await MessageUtils.send(channel, embed);
        } else {
            // See if a role was specified
            if (!msg.guild.me.hasPermission('MANAGE_ROLES')) {
                await InvalidUtils.notEnoughPermissions(msg.channel as TextChannel, [
                    'MANAGE_ROLES',
                ]);
                return;
            }

            // Find role with desired attributes
            let birthdayRole: Role = msg.mentions.roles.first();

            if (!birthdayRole) {
                birthdayRole = msg.guild.roles.cache.find(role =>
                    role.name.toLowerCase().includes(args[3].toLowerCase())
                );
            }

            if (
                !birthdayRole ||
                birthdayRole.id === msg.guild.id ||
                args[3].toLowerCase() === 'everyone'
            ) {
                let embed = new MessageEmbed()
                    .setDescription(`Invalid Role!`)
                    .setColor(Config.colors.error);
                MessageUtils.send(channel, embed);
                return;
            }

            if (
                birthdayRole.position >
                msg.guild.members.resolve(msg.client.user).roles.highest.position
            ) {
                await InvalidUtils.roleHierarchyError(msg.channel as TextChannel, birthdayRole);
                return;
            }

            if (birthdayRole.managed) {
                let embed = new MessageEmbed()
                    .setDescription(`Birthday Role cannot be managed by an external service!`)
                    .setColor(Config.colors.error);
                MessageUtils.send(channel, embed);
                return;
            }

            let membersWithRole = birthdayRole.members.size;

            if (membersWithRole > 0 && membersWithRole < 100) {
                let embed = new MessageEmbed()
                    .setTitle('Warning')
                    .setDescription(
                        `We have detected that __**${membersWithRole}**__ user${
                            membersWithRole > 1 ? 's' : ''
                        } already have that role!\nThe Birthday Role should ONLY be the role that users GET on their birthday!`
                    )
                    .setFooter(
                        `The Bot removes the Birthday Role from anyone whose birthday it isn't!`,
                        msg.client.user.avatarURL()
                    )
                    .setColor(Config.colors.warning);
                MessageUtils.send(channel, embed);
            } else if (membersWithRole > 100) {
                let embed = new MessageEmbed()
                    .setTitle('Error')
                    .setDescription(
                        `We have detected that __**${membersWithRole}**__ users already have that role!\nThe Birthday Role should ONLY be the role that users GET on their birthday!`
                    )
                    .setFooter(
                        `The Bot removes the Birthday Role from anyone whose birthday it isn't!`,
                        msg.client.user.avatarURL()
                    )
                    .setColor(Config.colors.error);
                MessageUtils.send(channel, embed);
                return;
            }

            await this.guildRepo.updateBirthdayRole(msg.guild.id, birthdayRole?.id);

            let embed = new MessageEmbed()
                .setDescription(`Successfully set the birthday role to ${birthdayRole.toString()}!`)
                .setFooter(`This role is actively removed from those whose birthday it isn't.`)
                .setColor(Config.colors.success);
            await MessageUtils.send(channel, embed);
        }
    }
}
