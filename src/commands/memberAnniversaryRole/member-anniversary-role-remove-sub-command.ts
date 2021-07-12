import { Message, Role, TextChannel } from 'discord.js';
import { MessageUtils, ParseUtils } from '../../utils';

import { Lang } from '../../services';
import { LangCode } from '../../models/enums';
import { MemberAnniversaryRoleRepo } from '../../services/database/repos';

const errorEmbed = Lang.getEmbed('validation.anniversaryRoleNoRoleOrPosition', LangCode.EN_US);

export class MemberAnniversaryRoleRemoveSubCommand {
    constructor(private memberAnniversaryRoleRepo: MemberAnniversaryRoleRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel): Promise<void> {
        let anniversaryRole: Role = msg.mentions.roles.first();
        let year: number;
        //bday mar remove role
        if (args.length <= 3) {
            await MessageUtils.send(channel, errorEmbed);
            return;
        }

        if (!anniversaryRole) {
            anniversaryRole = msg.guild.roles.cache.find(
                role =>
                    role.name.toLowerCase().includes(args[3].toLowerCase()) ||
                    role.id === args[3].toLowerCase()
            );
        }

        if (
            anniversaryRole &&
            (anniversaryRole.id === msg.guild.id || args[3].toLowerCase() === 'everyone')
        ) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.invalidRole', LangCode.EN_US)
            );
            return;
        }

        let memberAnniversaryRoles = await this.memberAnniversaryRoleRepo.getMemberAnniversaryRoles(
            msg.guild.id
        );

        if (anniversaryRole) {
            let role = memberAnniversaryRoles.memberAnniversaryRoles.filter(
                r => r.MemberAnniversaryRoleDiscordId === anniversaryRole.id
            );

            if (role.length > 0) year = role[0].Year;
        }

        if (!year) {
            year = ParseUtils.parseInt(args[3]);
        }

        if (!year) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.invalidAnniversaryRole', LangCode.EN_US, {
                    ICON: msg.client.user.displayAvatarURL(),
                })
            );
            return;
        }

        let role = memberAnniversaryRoles.memberAnniversaryRoles.find(r => r.Year === year);

        if (!role) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.invalidAnniversaryRole', LangCode.EN_US, {
                    ICON: msg.client.user.displayAvatarURL(),
                })
            );
            return;
        }

        await this.memberAnniversaryRoleRepo.removeMemberAnniversaryRole(msg.guild.id, year);

        let r = msg.guild.roles.resolve(role.MemberAnniversaryRoleDiscordId);

        await MessageUtils.send(
            channel,
            Lang.getEmbed('results.removedMemberAnniversaryRole', LangCode.EN_US, {
                ROLE: r ? r.toString() : '**Deleted Role**',
            })
        );
    }
}
