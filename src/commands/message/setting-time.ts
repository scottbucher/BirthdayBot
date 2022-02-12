import { ChatInputApplicationCommandData, CommandInteraction, PermissionString } from 'discord.js';

import { CustomRole } from '../../models/enums/index.js';
import { EventData } from '../../models/index.js';
import { GuildRepo } from '../../services/database/repos/index.js';
import { Lang } from '../../services/index.js';
import { FormatUtils } from '../../utils/format-utils.js';
import { InteractionUtils } from '../../utils/index.js';
import { Command } from '../index.js';

export class MessageSettingTimeSubCommand implements Command {
    constructor(public guildRepo: GuildRepo) {}
    public metadata: ChatInputApplicationCommandData = {
        name: Lang.getCom('subCommands.time'),
        description: undefined,
    };

    public deferType = undefined;
    public requireDev = false;
    public requireGuild = true;
    public requireClientPerms: PermissionString[] = [];
    public requireUserPerms: PermissionString[] = [];
    public requireRole = [CustomRole.BirthdayMaster];
    public requireSetup = true;
    public requireVote = false;
    public requirePremium = false;

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        // gets the type which is either BIRTHDAY, MEMBER_ANNIVERSARY, or SERVER_ANNIVERSARY
        let type = intr.options.getString(Lang.getCom('arguments.type'))?.toLowerCase();

        let messageTime = intr.options.getInteger(Lang.getCom('arguments.time'));

        let timeOutput: string;
        if (messageTime === 0)
            timeOutput = '12:00 ' + Lang.getRef('info', 'terms.amTime', data.lang());
        else if (messageTime === 12)
            timeOutput = '12:00 ' + Lang.getRef('info', 'terms.pmTime', data.lang());
        else if (messageTime < 12)
            timeOutput =
                `${messageTime - 12}` + ':00 ' + Lang.getRef('info', 'terms.amTime', data.lang());
        else
            timeOutput =
                `${messageTime - 12}` + ':00 ' + Lang.getRef('info', 'terms.pmTime', data.lang());

        let displayType = FormatUtils.getCelebrationDisplayType(
            type.replaceAll('_', ''),
            false
        ).toLowerCase();

        type === 'birthday'
            ? await this.guildRepo.updateBirthdayMessageTime(intr.guild.id, messageTime)
            : type === 'member_anniversary'
            ? await this.guildRepo.updateMemberAnniversaryMessageTime(intr.guild.id, messageTime)
            : await this.guildRepo.updateServerAnniversaryMessageTime(intr.guild.id, messageTime);
        await InteractionUtils.send(
            intr,
            Lang.getSuccessEmbed('results', 'successEmbeds.setMessageTime', data.lang(), {
                DISPLAY_TYPE: displayType,
                TIME: timeOutput,
            })
        );
    }
}
