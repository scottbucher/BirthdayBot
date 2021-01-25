import { MathUtils, MessageUtils, ParseUtils } from '../../utils';
import { Message, Role, TextChannel } from 'discord.js';

import { Lang } from '../../services';
import { LangCode } from '../../models/enums';
import { MemberAnniversaryRoleRepo } from '../../services/database/repos';

let Config = require('../../../config/config.json');

const errorEmbed = Lang.getEmbed('validation.trustedRoleNoRoleOrPosition', LangCode.EN);

export class MemberAnniversaryRoleRemoveSubCommand {
    constructor(private memberAnniversaryRoleRepo: MemberAnniversaryRoleRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel): Promise<void> {
        let position: number;

        if (args.length <= 3) {
            await MessageUtils.send(channel, errorEmbed);
            return;
        }

        let year = ParseUtils.parseInt(args[3]);

        if (!year || year > 1000 || year < 0) {
            await MessageUtils.send(channel, Lang.getEmbed('validation.invalidYear', LangCode.EN));
            return;
        }

        let memberAnniversaryRoles = await this.memberAnniversaryRoleRepo.getMemberAnniversaryRoles(
            msg.guild.id
        );

        let role = memberAnniversaryRoles.memberAnniversaryRoles.find(r => r.Year === year);

        if (!role) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.duplicateYear', LangCode.EN, { YEAR: year.toString() })
            );
            return;
        }

        await this.memberAnniversaryRoleRepo.removeMemberAnniversaryRole(msg.guild.id, position);

        let r = msg.guild.roles.resolve(role.MemberAnniversaryRoleDiscordId);

        await MessageUtils.send(
            channel,
            Lang.getEmbed('results.removedMemberAnniversaryRole', LangCode.EN, {
                ROLE: r ? r.toString() : '**Deleted Role**',
            })
        );
    }
}
