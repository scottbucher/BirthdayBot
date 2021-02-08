import { Message, Role, TextChannel } from 'discord.js';
import { MessageUtils, ParseUtils } from '../../utils';

import { Lang } from '../../services';
import { LangCode } from '../../models/enums';
import { TrustedRole } from '../../models/database';
import { TrustedRoleRepo } from '../../services/database/repos';

const errorEmbed = Lang.getEmbed('validation.trustedRoleNoRoleOrPosition', LangCode.EN_US);

export class TrustedRoleRemoveSubCommand {
    constructor(private trustedRoleRepo: TrustedRoleRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel): Promise<void> {
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
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.invalidRole', LangCode.EN_US)
            );
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
            position = ParseUtils.parseInt(args[3]);
        }

        if (!position) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.invalidTrustedRole', LangCode.EN_US)
            );
            return;
        }

        let role: TrustedRole;

        role = trustedRoles.trustedRoles.find(r => r.Position === position);

        if (!role) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.invalidTrustedRole', LangCode.EN_US)
            );
            return;
        }

        await this.trustedRoleRepo.removeTrustedRole(msg.guild.id, position);

        let r = msg.guild.roles.resolve(role.TrustedRoleDiscordId);

        await MessageUtils.send(
            channel,
            Lang.getEmbed('results.removedTrustedRole', LangCode.EN_US, {
                ROLE: r ? r.toString() : '**Deleted Role**',
            })
        );
    }
}
