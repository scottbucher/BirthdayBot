import { ApplicationCommandData, CommandInteraction, PermissionString } from 'discord.js';

import { ApplicationCommandOptionType } from 'discord-api-types';
import { EventData } from '../models/internal-models';
import { Lang } from '../services';
import { Command } from './command';
import {
    DateFormatSubCommand,
    NameFormatSubCommand,
    TimezoneSubCommand,
    TrustedSettingsCommand,
    UseTimezoneSubCommand,
} from './config-settings';

export class ConfigCommand implements Command {
    public metadata: ApplicationCommandData = {
        name: Lang.getCom('commands.config'),
        description: 'Manage config settings.',
        options: [
            {
                name: Lang.getCom('arguments.setting'),
                description: `Change Birthday Bot's config settings.`,
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
    public requireGuild = true;
    public requireClientPerms: PermissionString[] = ['VIEW_CHANNEL'];
    public requireUserPerms: PermissionString[] = [];
    public requireSetup = true;
    public requireVote = false;
    public requirePremium = false;

    constructor(
        public nameFormatSubCommand: NameFormatSubCommand,
        public timezoneSubCommand: TimezoneSubCommand,
        public useTimezoneSubCommand: UseTimezoneSubCommand,
        public dateFormatSubCommand: DateFormatSubCommand,
        public trustedSettingsCommand: TrustedSettingsCommand
    ) {}

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        let setting = intr.options.getString(Lang.getCom('arguments.setting'));
        let reset = intr.options.getBoolean(Lang.getCom('arguments.reset')) ?? false;

        switch (setting) {
            case 'NAME_FORMAT':
                await this.nameFormatSubCommand.execute(intr, data, reset);
                break;
            case 'TIME_ZONE':
                await this.timezoneSubCommand.execute(intr, data, reset);
                break;
            case 'USE_TIMEZONE':
                await this.useTimezoneSubCommand.execute(intr, data, reset);
                break;
            case 'DATE_FORMAT':
                await this.dateFormatSubCommand.execute(intr, data, reset);
                break;
            case 'TRUSTED_PREVENTS_MESSAGE':
            case 'TRUSTED_PREVENTS_ROLE':
            case 'REQUIRE_ALL_TRUSTED_ROLES':
                await this.trustedSettingsCommand.execute(intr, data, reset);
                break;
            case 'CHANNEL':
                // Code here
                break;
            case 'ROLE':
                // Code here
                break;
        }
    }
}
