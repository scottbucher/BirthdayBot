import { Chrono, en } from 'chrono-node';
import {
    ApplicationCommandOptionType,
    RESTPostAPIChatInputApplicationCommandsJSONBody,
} from 'discord-api-types/v10';
import { ButtonInteraction, CommandInteraction, PermissionString } from 'discord.js';

import { EventData } from '../models/index.js';
import { GuildRepo, UserRepo } from '../services/database/repos/index.js';
import { Lang } from '../services/index.js';
import { BirthdayUtils } from '../utils/birthday-utils.js';
import { FormatUtils, InteractionUtils } from '../utils/index.js';
import { Command, CommandDeferType } from './index.js';

export class SuggestCommand implements Command {
    public metadata: RESTPostAPIChatInputApplicationCommandsJSONBody = {
        name: Lang.getCom('commands.suggest'),
        description:
            'Suggest a birthday for another user. They will have to confirm the information.',
        dm_permission: false,
        default_member_permissions: '0',
        options: [
            {
                name: Lang.getCom('arguments.user'),
                description: 'The user who you are suggesting a birthday for.',
                type: ApplicationCommandOptionType.User.valueOf(),
                required: true,
            },
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
        let target = intr.options.getUser(Lang.getCom('arguments.user'));

        let timeZone = timezoneInput ? FormatUtils.findZone(timezoneInput) : undefined;

        if (target.bot) {
            await InteractionUtils.send(
                intr,
                Lang.getErrorEmbed('validation', 'errorEmbeds.cantSuggestForBot', data.lang())
            );
            return;
        }

        let userData = await this.userRepo.getUser(target.id);

        let changesLeft = userData ? userData?.ChangesLeft : 5;

        let nextIntr: CommandInteraction | ButtonInteraction = intr;

        [timeZone, nextIntr] = await BirthdayUtils.getUseServerDefaultTimezone(
            timeZone,
            target,
            data,
            intr,
            nextIntr
        );

        if (!timeZone)
            timeZone = await BirthdayUtils.getUserTimezone(timeZone, target, data, intr, nextIntr);

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
            birthday = await BirthdayUtils.getUserBirthday(
                birthday,
                target,
                data,
                intr,
                littleEndian,
                parser
            );

        if (birthday === undefined) return;

        await BirthdayUtils.confirmInformationAndStore(
            birthday,
            timeZone,
            changesLeft,
            target,
            data,
            intr,
            parser,
            this.userRepo
        );
    }
}
