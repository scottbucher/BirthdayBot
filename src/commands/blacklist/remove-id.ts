import { ApplicationCommandData, CommandInteraction, PermissionString } from 'discord.js';

import { Command } from '..';
import { EventData } from '../../models';
import { Lang } from '../../services';
import { BlacklistRepo } from '../../services/database/repos';
import { MessageUtils } from '../../utils';

export class BlacklistRemoveIdSubCommand implements Command {
    constructor(public blacklistRepo: BlacklistRepo) {}
    public metadata: ApplicationCommandData = {
        name: Lang.getCom('subCommands.id'),
        description: undefined,
    };

    public deferType = undefined;
    public requireDev = false;
    public requireGuild = true;
    public requireClientPerms: PermissionString[] = [];
    public requireUserPerms: PermissionString[] = [];
    public requireSetup = true;
    public requireVote = false;
    public requirePremium = false;

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        let id = intr.options.getString(Lang.getCom('arguments.id'));

        let blaklistData = await this.blacklistRepo.getBlacklist(intr.guild.id);

        if (!blaklistData.blacklist.map(b => b.DiscordId).includes(id)) {
            await MessageUtils.sendIntr(
                intr,
                Lang.getErrorEmbed('validation', 'errorEmbeds.notInBlacklist', data.lang(), {
                    TYPE: Lang.getRef('info', `types.id`, data.lang()),
                })
            );
            return;
        }

        await this.blacklistRepo.removeBlacklist(intr.guild.id, id);

        await MessageUtils.sendIntr(
            intr,
            Lang.getSuccessEmbed('results', 'successEmbeds.blacklistRemove', data.lang(), {
                TARGET: id,
            })
        );
    }
}
