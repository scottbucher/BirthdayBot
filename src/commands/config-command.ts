import { ApplicationCommandData, CommandInteraction, PermissionString } from 'discord.js';

import { ApplicationCommandOptionType } from 'discord-api-types';
import { EventData } from '../models/internal-models';
import { Lang } from '../services';
import { Command } from './command';

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
    public requireGuild = true;
    public requireClientPerms: PermissionString[] = [];
    public requireUserPerms: PermissionString[] = [];
    public requireSetup = true;
    public requireVote = false;
    public requirePremium = false;

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        let setting = intr.options.getString('arguments.setting');
        let reset = intr.options.getBoolean('arguments.reset');

        switch (setting) {
            case 'NAME_FORMAT':
                // Code here
                break;
            case 'TIME_ZONE':
                // Code here
                break;
            case 'USE_TIMEZONE':
                // Code here
                break;
            case 'DATE_FORMAT':
                // Code here
                break;
            case 'TRUSTED_PREVENTS_MESSAGE':
            case 'TRUSTED_PREVENTS_ROLE':
            case 'REQUIRE_ALL_TRUSTED_ROLES':
                // Code here
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
