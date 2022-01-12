import { ApplicationCommandData, CommandInteraction, PermissionString } from 'discord.js';

import { Command } from '..';
import { EventData } from '../../models';
import { Lang } from '../../services';
import { BlacklistRepo } from '../../services/database/repos';
import { MessageUtils } from '../../utils';
import { CollectorUtils } from '../../utils/collector-utils';

export class BlacklistClearSubCommand implements Command {
    constructor(public blacklistRepo: BlacklistRepo) {}
    public metadata: ApplicationCommandData = {
        name: Lang.getCom('subCommands.clear'),
        description: undefined,
    };

    public requireDev = false;
    public requireGuild = true;
    public requireClientPerms: PermissionString[] = [
        'ADD_REACTIONS',
        'VIEW_CHANNEL',
        'MANAGE_MESSAGES',
        'READ_MESSAGE_HISTORY',
    ];
    public requireUserPerms: PermissionString[] = [];
    public requireSetup = true;
    public requireVote = false;
    public requirePremium = false;

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        let blacklistData = await this.blacklistRepo.getBlacklist(intr.guild.id);

        if (!blacklistData || blacklistData.blacklist.length === 0) {
            await MessageUtils.sendIntr(
                intr,
                Lang.getErrorEmbed('validation', 'errorEmbeds.emptyBlacklist', data.lang())
            );
            return;
        }

        // Confirm
        let confirmation = await CollectorUtils.getBooleanFromReact(
            intr,
            data,
            Lang.getEmbed('prompts', 'clear.blacklist', data.lang(), {
                TOTAL: blacklistData.blacklist.length.toString(),
                ICON: intr.client.user.displayAvatarURL(),
            })
        );

        if (confirmation === undefined) return;

        if (!confirmation) {
            await MessageUtils.sendIntr(
                intr,
                Lang.getEmbed('results', 'fail.actionCanceled', data.lang())
            );
            return;
        }

        await this.blacklistRepo.clearBlacklist(intr.guild.id);

        await MessageUtils.sendIntr(
            intr,
            Lang.getSuccessEmbed('results', 'successEmbeds.blacklistAdd', data.lang())
        );
    }
}
