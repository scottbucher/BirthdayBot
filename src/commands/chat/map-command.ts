import { ChatInputCommandInteraction, PermissionsString } from 'discord.js';

import { DataValidation, EventDataType } from '../../enums/index.js';
import { Language } from '../../models/enum-helpers/language.js';
import { EventData } from '../../models/internal-models.js';
import { Lang } from '../../services/lang.js';
import { InteractionUtils } from '../../utils/index.js';
import { Command, CommandDeferType } from '../command.js';

export class MapCommand implements Command {
    public names = [Lang.getRef('commands', 'chatCommands.map', Language.Default)];
    public deferType = CommandDeferType.HIDDEN;
    public requireDev = false;
    public requireClientPerms: PermissionsString[] = [];
    public requireSetup = false;
    public requireVote = false;
    public requireEventData: EventDataType[] = [];
    public dataValidation: DataValidation[] = [];

    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        await InteractionUtils.send(
            intr,
            Lang.getEmbed('info', 'embeds.map', data.lang, {
                BOT: intr.client.user.toString(),
            })
        );
    }
}
