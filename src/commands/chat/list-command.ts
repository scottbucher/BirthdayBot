import { ChatInputCommandInteraction, PermissionsString } from 'discord.js';

import { CelebrationType, DataValidation, EventDataType } from '../../enums/index.js';
import { Language } from '../../models/enum-helpers/language.js';
import { EventData } from '../../models/internal-models.js';
import { Lang } from '../../services/lang.js';
import { InteractionUtils } from '../../utils/index.js';
import { Command, CommandDeferType } from '../command.js';

export class ListCommand implements Command {
    public names = [Lang.getRef('commands', 'chatCommands.list', Language.Default)];
    public deferType = CommandDeferType.HIDDEN;
    public requireDev = false;
    public requireClientPerms: PermissionsString[] = [];
    public requireSetup = false;
    public requireVote = false;
    public requireEventData: EventDataType[] = [];
    public dataValidation: DataValidation[] = [];

    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        let _type =
            (intr.options.getString(
                Lang.getRef('commands', 'arguments.type', Language.Default)
            ) as CelebrationType) ?? CelebrationType.BIRTHDAY;
        let _page =
            intr.options.getInteger(Lang.getRef('commands', 'arguments.page', Language.Default)) ??
            1;
        // TODO: Implement List Command
        await InteractionUtils.send(
            intr,
            Lang.getErrorEmbed('validation', 'errorEmbeds.notImplemented', data.lang)
        );
    }
}
