import { Message, Role, TextChannel } from 'discord.js';

import { Lang } from '../../services';
import { LangCode } from '../../models/enums';
import { MessageUtils } from '../../utils';
import { TrustedRoleRepo } from '../../services/database/repos/trusted-role-repo';

let Config = require('../../../config/config.json');

const errorEmbed = Lang.getEmbed('validation.noTrustedRoleSpecified', LangCode.EN);

export class TrustedRoleAddSubCommand {
    constructor(private trustedRoleRepo: TrustedRoleRepo) {}

    public async execute(
        args: string[],
        msg: Message,
        channel: TextChannel,
        hasPremium: boolean
    ): Promise<void> {
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
            MessageUtils.send(channel, Lang.getEmbed('validation.invalidRole', LangCode.EN));
            return;
        }

        if (trustedRole.managed) {
            MessageUtils.send(channel, Lang.getEmbed('validation.trustedRoleManaged', LangCode.EN));
            return;
        }

        let trustedRoles = await this.trustedRoleRepo.getTrustedRoles(msg.guild.id);

        if (
            trustedRoles &&
            trustedRoles.trustedRoles.length >= Config.validation.trustedRoles.maxCount.free &&
            !hasPremium
        ) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.maxFreeTrustedRoles', LangCode.EN, {
                    FREE_MAX: Config.validation.trustedRoles.maxCount.free.toString(),
                    PAID_MAX: Config.validation.trustedRoles.maxCount.paid.toString(),
                })
            );
            return;
        } else if (
            trustedRoles &&
            trustedRoles.trustedRoles.length >= Config.validation.message.maxCount.birthday.paid
        ) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.maxPaidTrustedRoles', LangCode.EN, {
                    PAID_MAX: Config.validation.trustedRoles.maxCount.paid.toString(),
                })
            );
            return;
        }

        if (trustedRoles.trustedRoles.find(role => role.TrustedRoleDiscordId === trustedRole.id)) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.duplicateTrustedRole', LangCode.EN, {
                    ROLE: trustedRole.toString(),
                })
            );
            return;
        }

        await this.trustedRoleRepo.addTrustedRole(msg.guild.id, trustedRole?.id);

        await MessageUtils.send(
            channel,
            Lang.getEmbed('results.addedTrustedRole', LangCode.EN, { ROLE: trustedRole.toString() })
        );
    }
}
