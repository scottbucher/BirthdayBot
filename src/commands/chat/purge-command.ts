import { ChatInputCommandInteraction, PermissionsString } from 'discord.js';

import { UserData } from '../../database/entities/user.js';
import { DataValidation, EventDataType } from '../../enums/index.js';
import { Language } from '../../models/enum-helpers/language.js';
import { EventData } from '../../models/internal-models.js';
import { Lang } from '../../services/lang.js';
import { CollectorUtils, InteractionUtils } from '../../utils/index.js';
import { Command, CommandDeferType } from '../command.js';

export class PurgeCommand implements Command {
    public names = [Lang.getRef('commands', 'chatCommands.purge', Language.Default)];
    public deferType = CommandDeferType.HIDDEN;
    public requireDev = false;
    public requireClientPerms: PermissionsString[] = [];
    public requireEventData: EventDataType[] = [];
    public dataValidation: DataValidation[] = [];

    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        let target = intr.user;
        let userData = await data.em.findOne(
            UserData,
            { discordId: target.id },
            { populate: ['birthday', 'timeZone'] }
        );

        if (!userData || !(userData.birthday && userData.timeZone)) {
            // Are they in the database?
            await InteractionUtils.send(
                intr,
                Lang.getErrorEmbed('validation', 'errorEmbeds.birthdayNotSet', data.lang, {
                    USER: target.toString(),
                })
            );
            return;
        }

        let result = await CollectorUtils.getBooleanFromButton(
            intr,
            data,
            Lang.getEmbed('prompts', 'embeds.birthdayConfirmPurge', data.lang, {
                ICON: intr.user.displayAvatarURL(),
            })
        );

        if (result === undefined) return;

        if (result.value) {
            // Confirm
            userData.birthday = undefined;
            userData.timeZone = undefined;
            await data.em.flush();

            await InteractionUtils.send(
                result.intr,
                Lang.getEmbed('results', 'success.purgeSuccessful', data.lang)
            );
        } else {
            // Cancel
            await InteractionUtils.send(
                result.intr,
                Lang.getEmbed('results', 'fail.actionCanceled', data.lang)
            );
        }
    }
}
