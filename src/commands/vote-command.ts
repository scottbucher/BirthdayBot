import { RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { CommandInteraction, PermissionString } from 'discord.js';

import { EventData } from '../models/index.js';
import { Lang } from '../services/index.js';
import { InteractionUtils } from '../utils/index.js';
import { Command, CommandDeferType } from './index.js';

export class VoteCommand implements Command {
    public metadata: RESTPostAPIChatInputApplicationCommandsJSONBody = {
        name: Lang.getCom('commands.vote'),
        description: 'Vote for Birthday Bot!',
        dm_permission: true,
        default_member_permissions: undefined,
    };
    public deferType = CommandDeferType.PUBLIC;
    public requireDev = false;
    public requireClientPerms: PermissionString[] = [];
    public requireSetup = false;
    public requireVote = false;
    public requirePremium = false;

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        await InteractionUtils.send(
            intr,
            Lang.getEmbed('info', 'embeds.vote', data.lang(), {
                BOT: intr.client.user.toString(),
            })
        );
    }
}
