import { ApplicationCommandData, CommandInteraction, PermissionString } from 'discord.js';

import { EventData } from '../models/internal-models';
import { Lang } from '../services';
import { MessageUtils } from '../utils';
import { Command, CommandDeferType } from './command';

export class HelpCommand implements Command {
    public metadata: ApplicationCommandData = {
        name: Lang.getCom('commands.help'),
        description: 'The help command.',
    };
    public deferType = CommandDeferType.PUBLIC;
    public requireDev = false;
    public requireGuild = false;
    public requireClientPerms: PermissionString[] = [];
    public requireUserPerms: PermissionString[] = [];
    public requireSetup = false;
    public requireVote = false;
    public requirePremium = false;

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        // await MessageUtils.sendIntr(intr, Lang.getEmbed('embeds.help', data.lang()));
    }
}
