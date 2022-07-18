import {
    ApplicationCommandType,
    RESTPostAPIContextMenuApplicationCommandsJSONBody,
} from 'discord-api-types/v10';
import { MessageContextMenuInteraction, PermissionString } from 'discord.js';

import { EventData } from '../../models/internal-models.js';
import { Lang } from '../../services/lang.js';
import { Command, CommandDeferType } from '../command.js';

export class ViewBirthdayCommand implements Command {
    public metadata: RESTPostAPIContextMenuApplicationCommandsJSONBody = {
        type: ApplicationCommandType.Message,
        name: Lang.getCom('messageCommands.viewDateSent'),
        default_member_permissions: undefined,
        dm_permission: true,
    };
    public deferType = CommandDeferType.PUBLIC;
    public requireClientPerms: PermissionString[] = [];
    public requireDev = false;
    public requireSetup = false;
    public requireVote = false;
    public requirePremium = false;

    public async execute(_intr: MessageContextMenuInteraction, _data: EventData): Promise<void> {
        return;
    }
}
