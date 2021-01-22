import { InvalidUtils, MessageUtils } from '../../utils';
import { Message, Role, TextChannel } from 'discord.js';

import { GuildRepo } from '../../services/database/repos';
import { Lang } from '../../services';
import { LangCode } from '../../models/enums';

const errorEmbed = Lang.getEmbed('validation.invalidMasterAction', LangCode.EN);

export class ConfigBirthdayMasterRoleSubCommand {
    constructor(private guildRepo: GuildRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel): Promise<void> {
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

            await MessageUtils.send(
                channel,
                Lang.getEmbed('results.masterRoleCreated', LangCode.EN, {
                    ROLE: birthdayMasterRole.toString(),
                })
            );
        } else if (args[3].toLowerCase() === 'clear') {
            // User wants to clear the birthday master role
            await this.guildRepo.updateBirthdayMasterRole(msg.guild.id, '0');

            await MessageUtils.send(
                channel,
                Lang.getEmbed('results.masterRoleCleared', LangCode.EN)
            );
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
                await MessageUtils.send(
                    channel,
                    Lang.getEmbed('validation.invalidRole', LangCode.EN)
                );
                return;
            }

            if (birthdayMasterRole.managed) {
                await MessageUtils.send(
                    channel,
                    Lang.getEmbed('validation.masterRoleManaged', LangCode.EN)
                );
                return;
            }

            await this.guildRepo.updateBirthdayMasterRole(msg.guild.id, birthdayMasterRole?.id);

            await MessageUtils.send(
                channel,
                Lang.getEmbed('results.masterRoleSet', LangCode.EN, {
                    ROLE: birthdayMasterRole.toString(),
                })
            );
        }
    }
}
