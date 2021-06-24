import { Message, Role, TextChannel } from 'discord.js';

import { GuildRepo } from '../../services/database/repos';
import { Lang } from '../../services';
import { LangCode } from '../../models/enums';
import { MessageUtils, FormatUtils } from '../../utils';

let Config = require('../../../config/config.json');

const errorEmbed = Lang.getEmbed('validation.invalidBirthdayRoleAction', LangCode.EN_US);

export class ConfigRoleSubCommand {
    constructor(private guildRepo: GuildRepo) { }

    public async execute(args: string[], msg: Message, channel: TextChannel): Promise<void> {
        if (args.length === 3) {
            await MessageUtils.send(channel, errorEmbed);
            return;
        }

        let action = FormatUtils.extractMiscActionType(args[3].toLowerCase())?.toLowerCase() ?? '';

        if (action === 'create') {
            // User wants to create the default birthday role
            if (!msg.guild.me.hasPermission('MANAGE_ROLES')) {
                await MessageUtils.send(
                    channel,
                    Lang.getEmbed('validation.needsManageChannels', LangCode.EN_US)
                );
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
                Lang.getEmbed('results.birthdayRoleCreated', LangCode.EN_US, {
                    ROLE: birthdayRole.toString(),
                })
            );
        } else if (action === 'clear') {
            // User wants to clear the birthday role
            await this.guildRepo.updateBirthdayRole(msg.guild.id, '0');

            await MessageUtils.send(
                channel,
                Lang.getEmbed('results.birthdayRoleCleared', LangCode.EN_US)
            );
        } else {
            // See if a role was specified
            if (!msg.guild.me.hasPermission('MANAGE_ROLES')) {
                await MessageUtils.send(
                    channel,
                    Lang.getEmbed('validation.needsManageChannels', LangCode.EN_US)
                );
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
                    Lang.getEmbed('validation.invalidRole', LangCode.EN_US)
                );
                return;
            }

            if (
                birthdayRole.position >
                msg.guild.members.resolve(msg.client.user).roles.highest.position
            ) {
                await MessageUtils.send(
                    msg.channel as TextChannel,
                    Lang.getEmbed('validation.roleHierarchyError', LangCode.EN_US, {
                        BOT: msg.client.user.toString(),
                    })
                );
                return;
            }

            if (birthdayRole.managed) {
                await MessageUtils.send(
                    channel,
                    Lang.getEmbed('validation.birthdayRoleManaged', LangCode.EN_US)
                );
                return;
            }

            let membersWithRole = birthdayRole.members.size;

            if (membersWithRole > 0 && membersWithRole < 100) {
                await MessageUtils.send(
                    channel,
                    Lang.getEmbed('validation.warnBirthdayRoleSize', LangCode.EN_US, {
                        AMOUNT: membersWithRole.toString(),
                    })
                );
            } else if (membersWithRole > 100) {
                await MessageUtils.send(
                    channel,
                    Lang.getEmbed('validation.denyBirthdayRoleSize', LangCode.EN_US, {
                        AMOUNT: membersWithRole.toString(),
                    })
                );
                return;
            }

            await this.guildRepo.updateBirthdayRole(msg.guild.id, birthdayRole?.id);
            await MessageUtils.send(
                channel,
                Lang.getEmbed('results.birthdayRoleSet', LangCode.EN_US, {
                    ROLE: birthdayRole.toString(),
                })
            );
        }
    }
}
