import {
    ButtonInteraction,
    ChatInputApplicationCommandData,
    CommandInteraction,
    PermissionString,
} from 'discord.js';

import { EventData } from '../../models/index.js';
import { GuildRepo } from '../../services/database/repos/index.js';
import { Lang } from '../../services/index.js';
import { CollectorUtils, InteractionUtils } from '../../utils/index.js';
import { Command } from '../index.js';

export class TrustedPreventsMsgSubCommand implements Command {
    constructor(public guildRepo: GuildRepo) {}
    public metadata: ChatInputApplicationCommandData = {
        name: Lang.getCom('settingType.trustedPreventsMessage'),
        description: undefined,
    };

    public deferType = undefined;
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
        let result: { intr: ButtonInteraction; value: boolean };

        // Get the prompt embed based on the setting, all are a true or false
        let promptEmbed = Lang.getEmbed('prompts', `config.trustedPreventsMessage`, data.lang());

        if (!reset) {
            result = await CollectorUtils.getBooleanFromButton(intr, data, promptEmbed);

            if (result === undefined) return;
        } else result = { intr: null, value: true };

        await this.guildRepo.updateTrustedPreventsMessage(intr.guild.id, result.value ? 1 : 0);

        await InteractionUtils.send(
            result.intr,
            Lang.getSuccessEmbed(
                'results',
                result
                    ? 'successEmbeds.trustedPreventsMessageYes'
                    : 'successEmbeds.trustedPreventsMessageNo',
                data.lang()
            )
        );
    }
}
