import { ChatInputApplicationCommandData, CommandInteraction, PermissionString } from 'discord.js';

import { CustomRole } from '../../models/enums/index.js';
import { EventData } from '../../models/index.js';
import { BlacklistRepo } from '../../services/database/repos/index.js';
import { Lang } from '../../services/index.js';
import { CollectorUtils, InteractionUtils } from '../../utils/index.js';
import { Command } from '../index.js';

export class BlacklistClearSubCommand implements Command {
    constructor(public blacklistRepo: BlacklistRepo) {}
    public metadata: ChatInputApplicationCommandData = {
        name: Lang.getCom('subCommands.clear'),
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
        let blacklistData = await this.blacklistRepo.getBlacklist(intr.guild.id);

        if (!blacklistData || blacklistData.blacklist.length === 0) {
            await InteractionUtils.send(
                intr,
                Lang.getErrorEmbed('validation', 'errorEmbeds.emptyBlacklist', data.lang())
            );
            return;
        }

        // Confirm
        let result = await CollectorUtils.getBooleanFromButton(
            intr,
            data,
            Lang.getEmbed('prompts', 'clear.blacklist', data.lang(), {
                TOTAL: blacklistData.blacklist.length.toString(),
                ICON: intr.client.user.displayAvatarURL(),
            })
        );

        if (result === undefined) return;

        if (!result.value) {
            await InteractionUtils.send(
                intr,
                Lang.getEmbed('results', 'fail.actionCanceled', data.lang())
            );
            return;
        }

        await this.blacklistRepo.clearBlacklist(intr.guild.id);

        await InteractionUtils.send(
            result.intr,
            Lang.getSuccessEmbed('results', 'successEmbeds.blacklistClear', data.lang())
        );
    }
}
