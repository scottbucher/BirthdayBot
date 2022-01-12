import {
    ApplicationCommandData,
    CommandInteraction,
    Message,
    MessageReaction,
    PermissionString,
    User,
} from 'discord.js';

import { EventData } from '../../models';
import { Lang } from '../../services';
import { GuildRepo } from '../../services/database/repos';
import { FormatUtils, MessageUtils } from '../../utils';
import { CollectorUtils } from '../../utils/collector-utils';
import { Command } from '../command';

let Config = require('../../../config/config.json');

const trueFalseOptions = [Config.emotes.confirm, Config.emotes.deny];
export class TrustedPreventsMsgSubCommand implements Command {
    constructor(public guildRepo: GuildRepo) {}
    public metadata: ApplicationCommandData = {
        name: Lang.getCom('settingType.trustedPreventsMessage'),
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
        let setting = intr.options.getString(Lang.getCom('arguments.setting'));
        let reset = intr.options.getBoolean(Lang.getCom('arguments.reset')) ?? false;
        let choice: number;

        // Get the prompt embed based on the setting, all are a true or false
        let promptEmbed = Lang.getEmbed('prompts', `config.trustedPreventsMessage`, data.lang());

        if (!reset) {
            choice = await CollectorUtils.getBooleanFromReact(intr, data, promptEmbed);

            if (choice === undefined) return;
        } else choice = 1;

        await this.guildRepo.updateTrustedPreventsMessage(intr.guild.id, choice);

        await MessageUtils.sendIntr(
            intr,
            Lang.getSuccessEmbed(
                'results',
                choice
                    ? 'successEmbeds.trustedPreventsMessageYes'
                    : 'successEmbeds.trustedPreventsMessageNo',
                data.lang()
            )
        );
    }
}
