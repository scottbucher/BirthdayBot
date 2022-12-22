import { Chrono, en } from 'chrono-node';
import {
    ChatInputCommandInteraction,
    CommandInteraction,
    MessageComponentInteraction,
    ModalSubmitInteraction,
    PermissionsString,
} from 'discord.js';

import { UserData } from '../../database/entities/index.js';
import { DataValidation, DateFormat, EventDataType } from '../../enums/index.js';
import { Language } from '../../models/enum-helpers/language.js';
import { EventData } from '../../models/internal-models.js';
import { Lang } from '../../services/lang.js';
import { BirthdayUtils, FormatUtils, InteractionUtils, TimeZoneUtils } from '../../utils/index.js';
import { Command, CommandDeferType } from '../command.js';

export class SuggestCommand implements Command {
    public names = [Lang.getRef('commands', 'chatCommands.suggest', Language.Default)];
    public deferType = CommandDeferType.PUBLIC;
    public requireDev = false;
    public requireClientPerms: PermissionsString[] = [];
    public requireEventData: EventDataType[] = [];
    public dataValidation: DataValidation[] = [];

    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        let birthdayInput = intr.options.getString(
            Lang.getRef('commands', 'arguments.date', Language.Default)
        );
        let timezoneInput = intr.options.getString(
            Lang.getRef('commands', 'arguments.timeZone', Language.Default)
        );
        let target = intr.options.getUser(
            Lang.getRef('commands', 'arguments.user', Language.Default)
        );

        let timeZone = timezoneInput ? TimeZoneUtils.find(timezoneInput).name : undefined;

        if (target.bot) {
            await InteractionUtils.send(
                intr,
                Lang.getErrorEmbed('validation', 'errorEmbeds.cantSuggestForBot', data.lang),
                false
            );
            return;
        }

        let userData = await data.em.findOne(
            UserData,
            { discordId: intr.user.id },
            { populate: ['birthdayStartUTC', 'timeZone'] }
        );

        let guildData = data.guildData;

        let nextIntr: CommandInteraction | MessageComponentInteraction | ModalSubmitInteraction =
            intr;

        [nextIntr, timeZone] = await BirthdayUtils.getUseServerDefaultTimezone(
            timeZone,
            target,
            data,
            intr,
            nextIntr,
            false
        );

        if (!timeZone)
            [nextIntr, timeZone] = await BirthdayUtils.getUserTimezone(
                target,
                data,
                intr,
                nextIntr,
                false
            );

        if (timeZone === undefined) return;

        let littleEndian = !guildData
            ? false
            : guildData.formatSettings.date === DateFormat.MONTH_DAY
            ? false
            : true;

        let parser = new Chrono(en.createConfiguration(true, littleEndian));
        let birthday = birthdayInput
            ? FormatUtils.getBirthday(birthdayInput, parser, littleEndian, data.lang)
            : undefined;

        if (!birthday)
            [nextIntr, birthday] = await BirthdayUtils.getUserBirthday(
                birthday,
                target,
                data,
                intr,
                nextIntr,
                littleEndian,
                parser,
                false
            );

        if (birthday === undefined) return;

        await BirthdayUtils.confirmInformationAndStore(
            birthday,
            timeZone,
            target,
            data,
            nextIntr,
            parser,
            userData,
            false
        );
    }
}
