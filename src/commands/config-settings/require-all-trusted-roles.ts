import { ApplicationCommandData, CommandInteraction, PermissionString } from 'discord.js';

import { EventData } from '../../models';
import { Lang } from '../../services';
import { GuildRepo } from '../../services/database/repos';
import { MessageUtils } from '../../utils';
import { CollectorUtils } from '../../utils/collector-utils';
import { Command } from '../command';
export class RequireAllTrustedRolesSubCommand implements Command {
    constructor(public guildRepo: GuildRepo) {}
    public metadata: ApplicationCommandData = {
        name: Lang.getCom('settingType.requireAllTrustedRoles'),
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
        let reset = intr.options.getBoolean(Lang.getCom('arguments.reset')) ?? false;
        let choice: number;

        // Get the prompt embed based on the setting, all are a true or false
        let promptEmbed = Lang.getEmbed('prompts', `config.trustedRequireAll`, data.lang());

        if (!reset) {
            choice = await CollectorUtils.getBooleanFromReact(intr, data, promptEmbed);

            if (choice === undefined) return;
        } else choice = 1;

        await this.guildRepo.updateRequireAllTrustedRoles(intr.guild.id, choice);

        await MessageUtils.sendIntr(
            intr,
            Lang.getSuccessEmbed(
                'results',
                choice ? 'successEmbeds.requireAllTrustedYes' : 'successEmbeds.requireAllTrustedNo',
                data.lang()
            )
        );
    }
}