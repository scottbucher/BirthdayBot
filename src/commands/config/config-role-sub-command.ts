import { InvalidUtils, MessageUtils } from '../../utils';
import { Message, Role, TextChannel } from 'discord.js';

import { GuildRepo } from '../../services/database/repos';
import { Lang } from '../../services';
import { LangCode } from '../../models/enums';

let Config = require('../../../config/config.json');

const errorEmbed = Lang.getEmbed('validation.invalidBirthdayRoleAction', LangCode.EN);

export class ConfigRoleSubCommand {
    constructor(private guildRepo: GuildRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel): Promise<void> {
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

            await MessageUtils.send(
                channel,
                Lang.getEmbed('results.birthdayRoleCreated', LangCode.EN, {
                    ROLE: birthdayRole.toString(),
                })
            );
        } else if (args[3].toLowerCase() === 'clear') {
            // User wants to clear the birthday role
            await this.guildRepo.updateBirthdayRole(msg.guild.id, '0');

            await MessageUtils.send(
                channel,
                Lang.getEmbed('results.birthdayRoleCleared', LangCode.EN)
            );
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
                await MessageUtils.send(
                    channel,
                    Lang.getEmbed('validation.invalidRole', LangCode.EN)
                );
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
                await MessageUtils.send(
                    channel,
                    Lang.getEmbed('validation.birthdayRoleManaged', LangCode.EN)
                );
                return;
            }

            let membersWithRole = birthdayRole.members.size;

            if (membersWithRole > 0 && membersWithRole < 100) {
                await MessageUtils.send(
                    channel,
                    Lang.getEmbed('validation.warnBirthdayRoleSize', LangCode.EN, {
                        AMOUNT: membersWithRole.toString(),
                    })
                );
            } else if (membersWithRole > 100) {
                await MessageUtils.send(
                    channel,
                    Lang.getEmbed('validation.denyBirthdayRoleSize', LangCode.EN, {
                        AMOUNT: membersWithRole.toString(),
                    })
                );
                return;
            }

            await this.guildRepo.updateBirthdayRole(msg.guild.id, birthdayRole?.id);
            await MessageUtils.send(
                channel,
                Lang.getEmbed('results.birthdayRoleSet', LangCode.EN, {
                    ROLE: birthdayRole.toString(),
                })
            );
        }
    }
}
