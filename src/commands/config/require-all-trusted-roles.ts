import {
    ButtonInteraction,
    ChatInputApplicationCommandData,
    CommandInteraction,
    PermissionString,
} from 'discord.js';

import { CustomRole } from '../../enums/role.js';
import { EventData } from '../../models/index.js';
import { GuildRepo } from '../../services/database/repos/index.js';
import { Lang } from '../../services/index.js';
import { CollectorUtils, InteractionUtils } from '../../utils/index.js';
import { Command } from '../index.js';
export class RequireAllTrustedRolesSubCommand implements Command {
    constructor(public guildRepo: GuildRepo) {}
    public metadata: ChatInputApplicationCommandData = {
        name: Lang.getCom('settingType.requireAllTrustedRoles'),
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
        let reset = intr.options.getBoolean(Lang.getCom('arguments.reset')) ?? false;
        let result: { intr: ButtonInteraction | CommandInteraction; value: boolean };

        // Get the prompt embed based on the setting, all are a true or false
        let promptEmbed = Lang.getEmbed('prompts', `config.trustedRequireAll`, data.lang());

        if (!reset) {
            result = await CollectorUtils.getBooleanFromButton(intr, data, promptEmbed);

            if (result === undefined) return;
        } else result = { intr: intr, value: true };

        await this.guildRepo.updateRequireAllTrustedRoles(intr.guild.id, result.value ? 1 : 0);

        await InteractionUtils.send(
            result.intr,
            Lang.getSuccessEmbed(
                'results',
                result ? 'successEmbeds.requireAllTrustedYes' : 'successEmbeds.requireAllTrustedNo',
                data.lang()
            )
        );
    }
}
