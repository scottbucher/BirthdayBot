import { Message, Role, TextChannel } from 'discord.js';
import { MessageUtils, ParseUtils, CelebrationUtils, ActionUtils } from '../../utils';

import { Lang } from '../../services';
import { LangCode } from '../../models/enums';
import { MemberAnniversaryRoleRepo, GuildRepo } from '../../services/database/repos';
import moment from 'moment';
import { GuildData } from '../../models/database';

let Config = require('../../../config/config.json');

const errorEmbed = Lang.getEmbed('validation.noYear', LangCode.EN_US);

export class MemberAnniversaryRoleClaimSubCommand {
    constructor(private memberAnniversaryRoleRepo: MemberAnniversaryRoleRepo) { }

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
        if (args.length === 3) {
            await MessageUtils.send(channel, errorEmbed);
            return;
        }

        let memberAnniversaryRoleData = await this.memberAnniversaryRoleRepo.getMemberAnniversaryRoles(msg.guild.id);

        if (!memberAnniversaryRoleData || memberAnniversaryRoleData.stats.TotalItems === 0) {
            // No roles to claim
            return;
        }
        let timezone = guildData?.DefaultTimezone;

        let memberJoinedAt = moment(msg.member.joinedAt).tz(timezone);
        let now = timezone ? moment.tz(timezone) : moment.tz();
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

        let roleData = memberAnniversaryRoleData.memberAnniversaryRoles.filter(data => data.Year <= yearsOldRoundedDown);

        let roles = await CelebrationUtils.getMemberAnniversaryRoleList(msg.guild, roleData);

        // Give the roles they are owed
        for (let role of roles) {
            // TODO: make sleep interval a config value
            await ActionUtils.giveRole(msg.member, role, 250);
        }

        await MessageUtils.send(channel, Lang.getEmbed('results.memberAnnversaryRolesClaimed', LangCode.EN_US));
    }
}
