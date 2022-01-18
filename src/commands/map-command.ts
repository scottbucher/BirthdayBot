import { ApplicationCommandData, CommandInteraction, PermissionString } from 'discord.js';

import { EventData } from '../models/index.js';
import { Lang } from '../services/index.js';
import { MessageUtils } from '../utils/index.js';
import { Command, CommandDeferType } from './index.js';

export class MapCommand implements Command {
    public metadata: ApplicationCommandData = {
        name: Lang.getCom('commands.map'),
        description: 'View the timezone map.',
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
        await MessageUtils.sendIntr(
            intr,
            Lang.getEmbed('info', 'embeds.map', data.lang(), {
                BOT: intr.client.user.toString(),
            })
        );
    }
}
