import { ApplicationCommandData, CommandInteraction } from 'discord.js';

import { ApplicationCommandOptionType } from 'discord-api-types';
import { ApplicationCommandOptionTypes } from 'discord.js/typings/enums';
import { Command } from './command';
import { EventData } from '../models/internal-models';
import { Lang } from '../services';
import { MessageUtils } from '../utils';

export class ConfigCommand implements Command {
    public metadata: ApplicationCommandData = {
        name: Lang.getCom('commands.config'),
        description: 'Manage config settings.',
        options: [
            {
                name: Lang.getCom('arguments.setting'),
                description: "Change Birthday Bot's config settings.",
                type: ApplicationCommandOptionType.String.valueOf(),
                required: true,
                choices: [
                    {
                        name: Lang.getCom('settingType.nameFormat'),
                        value: 'NAME_FORMAT',
                    },
                    {
                        name: Lang.getCom('settingType.timeZone'),
                        value: 'TIME_ZONE',
                    },
                    {
                        name: Lang.getCom('settingType.useTimezone'),
                        value: 'USE_TIMEZONE',
                    },
                    {
                        name: Lang.getCom('settingType.dateFormat'),
                        value: 'DATE_FORMAT',
                    },
                    {
                        name: Lang.getCom('settingType.trustedPreventsMessage'),
                        value: 'TRUSTED_PREVENTS_MESSAGE',
                    },
                    {
                        name: Lang.getCom('settingType.trustedPreventsRole'),
                        value: 'TRUSTED_PREVENTS_ROLE',
                    },
                    {
                        name: Lang.getCom('settingType.requireAllTrustedRoles'),
                        value: 'REQUIRE_ALL_TRUSTED_ROLES',
                    },
                    {
                        name: Lang.getCom('settingType.channel'),
                        value: 'CHANNEL',
                    },
                    {
                        name: Lang.getCom('settingType.role'),
                        value: 'ROLE',
                    },
                ],
            },
            {
                name: Lang.getCom('arguments.reset'),
                description: 'Reset this setting to the default value.',
                type: ApplicationCommandOptionType.Boolean.valueOf(),
                required: false,
            },
        ],
    };
    public requireDev = false;
    public requireGuild = false;
    public requirePerms = [];

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        await MessageUtils.sendIntr(intr, Lang.getEmbed('displayEmbeds.help', data.lang()));
    }
}
