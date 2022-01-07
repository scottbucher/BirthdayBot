import { ApplicationCommandData, CommandInteraction, PermissionString } from 'discord.js';

import { EventData } from '../models/internal-models';
import { Lang } from '../services';
import { MessageUtils } from '../utils';
import { Command } from './command';

export class VoteCommand implements Command {
    public metadata: ApplicationCommandData = {
        name: Lang.getCom('commands.vote'),
        description: 'Vote for Birthday Bot!',
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
            Lang.getEmbed('info', 'embeds.vote', data.lang(), {
                BOT: intr.client.user.toString(),
            })
        );
    }
}
