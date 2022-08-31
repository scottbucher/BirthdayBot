import { Chrono, en } from 'chrono-node';
import {
    ApplicationCommandOptionType,
    RESTPostAPIChatInputApplicationCommandsJSONBody,
} from 'discord-api-types/v10';
import {
    BaseCommandInteraction,
    CommandInteraction,
    MessageComponentInteraction,
    ModalSubmitInteraction,
    PermissionString,
} from 'discord.js';

import { EventData } from '../models/index.js';
import { GuildRepo, UserRepo } from '../services/database/repos/index.js';
import { Lang } from '../services/index.js';
import { BirthdayUtils } from '../utils/birthday-utils.js';
import { FormatUtils } from '../utils/index.js';
import { Command, CommandDeferType } from './index.js';

export class SetCommand implements Command {
    public metadata: RESTPostAPIChatInputApplicationCommandsJSONBody = {
        name: Lang.getCom('commands.set'),
        description: 'Set your birthday',
        dm_permission: true,
        default_member_permissions: undefined,
        options: [
            {
                name: Lang.getCom('arguments.date'),
                description: 'The date of the birthday you want to set.',
                type: ApplicationCommandOptionType.String.valueOf(),
                required: false,
            },
            {
                name: Lang.getCom('arguments.timezone'),
                description: 'The timezone the birthday will be celebrated in.',
                type: ApplicationCommandOptionType.String.valueOf(),
                required: false,
            },
        ],
    };

    public deferType = CommandDeferType.PUBLIC;
    public requireDev = false;
    public requireClientPerms: PermissionString[] = ['VIEW_CHANNEL'];
    public requireSetup = false;
    public requireVote = false;
    public requirePremium = false;

    constructor(public guildRepo: GuildRepo, public userRepo: UserRepo) {}

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        let birthdayInput = intr.options.getString(Lang.getCom('arguments.date'));
        let timezoneInput = intr.options.getString(Lang.getCom('arguments.timezone'));

        let timeZone = timezoneInput ? FormatUtils.findZone(timezoneInput) : undefined;

        let userData = await this.userRepo.getUser(intr.user.id);

        let changesLeft = userData ? userData?.ChangesLeft : 5;

        let nextIntr:
            | BaseCommandInteraction
            | MessageComponentInteraction
            | ModalSubmitInteraction = intr;

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

        let littleEndian = !data.guild
            ? false
            : data.guild.DateFormat === 'month_day'
            ? false
            : true;

        let parser = new Chrono(en.createConfiguration(true, littleEndian));
        let birthday = birthdayInput
            ? FormatUtils.getBirthday(birthdayInput, parser, littleEndian)
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
            changesLeft,
            intr.user,
            data,
            nextIntr,
            parser,
            this.userRepo
        );
    }
}
