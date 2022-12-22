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
import { BirthdayUtils, FormatUtils, TimeZoneUtils } from '../../utils/index.js';
import { Command, CommandDeferType } from '../command.js';

export class SetCommand implements Command {
    public names = [Lang.getRef('commands', 'chatCommands.set', Language.Default)];
    public deferType = CommandDeferType.HIDDEN;
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

        let timeZone = timezoneInput ? TimeZoneUtils.find(timezoneInput).name : undefined;

        let userData = await data.em.findOne(
            UserData,
            { discordId: intr.user.id },
            { populate: ['birthday', 'timeZone'] }
        );

        let nextIntr: CommandInteraction | MessageComponentInteraction | ModalSubmitInteraction =
            intr;

        [nextIntr, timeZone] = await BirthdayUtils.getUseServerDefaultTimezone(
            timeZone,
            intr.user,
            data,
            intr,
            nextIntr
        );

        if (!timeZone)
            [nextIntr, timeZone] = await BirthdayUtils.getUserTimezone(
                intr.user,
                data,
                intr,
                nextIntr
            );

        if (timeZone === undefined) return;

        let littleEndian = !data.guildData
            ? false
            : data.guildData.formatSettings.date === DateFormat.MONTH_DAY
            ? false
            : true;

        let parser = new Chrono(en.createConfiguration(true, littleEndian));
        let birthday = birthdayInput
            ? FormatUtils.getBirthday(birthdayInput, parser, littleEndian, data.lang)
            : undefined;

        if (!birthday)
            [nextIntr, birthday] = await BirthdayUtils.getUserBirthday(
                birthday,
                intr.user,
                data,
                intr,
                nextIntr,
                littleEndian,
                parser
            );

        if (birthday === undefined) return;

        await BirthdayUtils.confirmInformationAndStore(
            birthday,
            timeZone,
            intr.user,
            data,
            nextIntr,
            parser,
            userData
        );
    }
}
