import { ChatInputCommandInteraction, PermissionsString } from 'discord.js';

import { DataValidation, EventDataType, HelpOption } from '../../enums/index.js';
import { Language } from '../../models/enum-helpers/language.js';
import { EventData } from '../../models/internal-models.js';
import { Lang } from '../../services/lang.js';
import { InteractionUtils } from '../../utils/index.js';
import { Command, CommandDeferType } from '../command.js';

export class HelpCommand implements Command {
    public names = [Lang.getRef('commands', 'chatCommands.link', Language.Default)];
    public deferType = CommandDeferType.HIDDEN;
    public requireDev = false;
    public requireClientPerms: PermissionsString[] = [];
    public requireEventData: EventDataType[] = [];
    public dataValidation: DataValidation[] = [];

    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        let _helpOption = intr.options.getString(
            Lang.getRef('commands', 'arguments.option', Language.Default)
        ) as HelpOption;

        await InteractionUtils.send(
            intr,
            Lang.getEmbed('validation', 'embeds.notImplemented', data.lang)
        );
    }
}
