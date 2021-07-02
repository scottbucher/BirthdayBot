import { Message, Role, TextChannel } from 'discord.js';
import { MessageUtils, ParseUtils } from '../../utils';

import { Lang } from '../../services';
import { LangCode } from '../../models/enums';
import { MemberAnniversaryRoleRepo } from '../../services/database/repos';

let Config = require('../../../config/config.json');

const errorEmbed = Lang.getEmbed('validation.invalidUsageMemberAnniversaryRoleAdd', LangCode.EN_US);

export class MemberAnniversaryRoleAddSubCommand {
    constructor(private memberAnniversaryRoleRepo: MemberAnniversaryRoleRepo) {}

    public async execute(
        args: string[],
        msg: Message,
        channel: TextChannel,
        hasPremium: boolean
    ): Promise<void> {
        // bday mar add year role
        if (!hasPremium) {
            MessageUtils.send(
                channel,
                Lang.getEmbed('premiumRequired.anniversaryRoles', LangCode.EN_US)
            );
            return;
        }
        if (args.length < 5) {
            await MessageUtils.send(channel, errorEmbed);
            return;
        }

        let year = ParseUtils.parseInt(args[3]);

        if (!year || year > 1000 || year < 0) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.invalidYear', LangCode.EN_US)
            );
            return;
        }

        // See if a role was specified
        let memberAnniversaryRole: Role = msg.mentions.roles.first();

        if (!memberAnniversaryRole) {
            memberAnniversaryRole = msg.guild.roles.cache.find(
                role =>
                    role.name.toLowerCase().includes(args[4].toLowerCase()) ||
                    role.id === args[4].toLowerCase()
            );
        }

        if (
            !memberAnniversaryRole ||
            memberAnniversaryRole.id === msg.guild.id ||
            args[3].toLowerCase() === 'everyone'
        ) {
            MessageUtils.send(channel, Lang.getEmbed('validation.invalidRole', LangCode.EN_US));
            return;
        }

        if (memberAnniversaryRole.managed) {
            MessageUtils.send(
                channel,
                Lang.getEmbed('validation.memberAnniversaryRoleManaged', LangCode.EN_US)
            );
            return;
        }

        let memberAnniversaryRoles = await this.memberAnniversaryRoleRepo.getMemberAnniversaryRoles(
            msg.guild.id
        );

        if (memberAnniversaryRoles.memberAnniversaryRoles.find(role => role.Year === year)) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.duplicateYear', LangCode.EN_US, {
                    YEAR: year.toString(),
                })
            );
            return;
            return;
        }

        if (
            memberAnniversaryRoles &&
            memberAnniversaryRoles.memberAnniversaryRoles.length >=
                Config.validation.memberAnniversaryRoles.maxCount.paid
        ) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.maxPaidMemberAnniversaryRoles', LangCode.EN_US, {
                    PAID_MAX: Config.validation.trustedRoles.maxCount.paid.toString(),
                })
            );
            return;
        }

        await this.memberAnniversaryRoleRepo.addMemberAnniversaryRole(
            msg.guild.id,
            memberAnniversaryRole?.id,
            year
        );

        await MessageUtils.send(
            channel,
            Lang.getEmbed('results.addedMemberAnniversaryRole', LangCode.EN_US, {
                ROLE: memberAnniversaryRole.toString(),
                YEAR: year.toString(),
            })
        );
    }
}
