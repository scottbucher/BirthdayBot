import { ActionUtils, CelebrationUtils, MessageUtils } from '../../utils';
import { Message, TextChannel } from 'discord.js';

import { GuildData } from '../../models/database';
import { Lang } from '../../services';
import { LangCode } from '../../models/enums';
import { MemberAnniversaryRoleRepo } from '../../services/database/repos';
import moment from 'moment';

export class MemberAnniversaryRoleClaimSubCommand {
    constructor(private memberAnniversaryRoleRepo: MemberAnniversaryRoleRepo) {}

    public async execute(
        args: string[],
        msg: Message,
        channel: TextChannel,
        hasPremium: boolean,
        guildData: GuildData
    ): Promise<void> {
        if (!hasPremium) {
            MessageUtils.send(
                channel,
                Lang.getEmbed('premiumRequired.anniversaryRoles', LangCode.EN_US)
            );
            return;
        }

        let memberAnniversaryRoleData =
            await this.memberAnniversaryRoleRepo.getMemberAnniversaryRoles(msg.guild.id);

        if (
            !memberAnniversaryRoleData ||
            memberAnniversaryRoleData.memberAnniversaryRoles.length === 0
        ) {
            // No roles to claim
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.noMemberAnniversaryRoles', LangCode.EN_US)
            );
            return;
        }
        let timezone = guildData?.DefaultTimezone;

        if (!timezone) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.serverTimezoneNotSet', LangCode.EN_US)
            );
            return;
        }

        let memberJoinedAt = moment(msg.member.joinedAt).tz(timezone);
        let now = moment.tz(timezone);
        let yearsOldRoundedDown = now.year() - memberJoinedAt.year();

        // If the date hasn't passed yet this year then we decrease the year
        // Unlike bday next we don't want to round up for this
        if (
            moment(memberJoinedAt.format('MM-DD'), 'MM-DD').diff(
                moment(now.format('MM-DD'), 'MM-DD'),
                'days'
            ) > 0
        )
            yearsOldRoundedDown--;

        let roleData = memberAnniversaryRoleData.memberAnniversaryRoles.filter(
            data => data.Year <= yearsOldRoundedDown
        );

        if (roleData.length === 0) {
            // No roles to claim
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.noMemberAnniversaryRolesToClaim', LangCode.EN_US)
            );
            return;
        }

        let roles = await CelebrationUtils.getMemberAnniversaryRoleList(msg.guild, roleData);

        // Give the roles they are owed
        for (let role of roles) {
            if (!msg.member.roles.cache.has(role.id)) {
                await ActionUtils.giveRole(msg.member, role, 250);
            }
        }

        await MessageUtils.send(
            channel,
            Lang.getEmbed('results.memberAnniversaryRolesClaimed', LangCode.EN_US)
        );
    }
}
