import { ApplicationCommandData, CommandInteraction, PermissionString } from 'discord.js';

import { Command } from './command';
import { EventData } from '../models/internal-models';
import { Lang } from '../services';
import { MessageUtils } from '../utils';

export class InfoCommand implements Command {
    public metadata: ApplicationCommandData = {
        name: Lang.getCom('commands.info'),
        description: 'Information about the bot.',
    };
    public requireDev = false;
    public requireGuild = false;
    public requireClientPerms: PermissionString[] = [];
    public requireUserPerms: PermissionString[] = [];
    public requireSetup = false;
    public requireVote = false;
    public requirePremium = false;

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        await MessageUtils.sendIntr(intr, Lang.getEmbed('info', 'embeds.info', data.lang()));
    }
}
