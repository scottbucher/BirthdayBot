import { ApplicationCommandData, CommandInteraction, PermissionString } from 'discord.js';

import { LangCode } from '../models/enums';
import { EventData } from '../models/internal-models';
import { Lang } from '../services';
import { MessageUtils } from '../utils';
import { Command } from './command';

export class MapCommand implements Command {
    public metadata: ApplicationCommandData = {
        name: Lang.getCom('commands.map'),
        description: 'View the timezone map.',
    };
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
