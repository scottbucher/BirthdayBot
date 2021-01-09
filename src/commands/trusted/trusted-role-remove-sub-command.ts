import { Message, MessageEmbed, Role, TextChannel } from 'discord.js';

import { Lang } from '../../services';
import { LangCode } from '../../models/enums';
import { MessageUtils } from '../../utils';
import { TrustedRole } from '../../models/database';
import { TrustedRoleRepo } from '../../services/database/repos/trusted-role-repo';

let Config = require('../../../config/config.json');

const errorEmbed = Lang.getEmbed('validation.trustedRoleNoRoleOrPosition', LangCode.EN);

export class TrustedRoleRemoveSubCommand {
    constructor(private trustedRoleRepo: TrustedRoleRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel) {
        // See if a role was specified
        let trustedRole: Role = msg.mentions.roles.first();
        let position: number;

        if (args.length <= 3) {
            await MessageUtils.send(channel, errorEmbed);
            return;
        }

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
            await MessageUtils.send(channel, Lang.getEmbed('validation.invalidRole', LangCode.EN));
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
                await MessageUtils.send(
                    channel,
                    Lang.getEmbed('validation.trustedRoleInvalidRoleOrPosition', LangCode.EN)
                );
                return;
            }
        }

        if (!position) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.invalidTrustedRole', LangCode.EN)
            );
            return;
        }

        let role: TrustedRole;

        role = trustedRoles.trustedRoles.find(r => r.Position === position);

        if (!role) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.invalidTrustedRole', LangCode.EN)
            );
            return;
        }

        await this.trustedRoleRepo.removeTrustedRole(msg.guild.id, position);

        let r = msg.guild.roles.resolve(role.TrustedRoleDiscordId);

        await MessageUtils.send(
            channel,
            Lang.getEmbed('results.removedTrustedRole', LangCode.EN, {
                ROLE: r ? r.toString() : '**Deleted Role**',
            })
        );
    }
}
