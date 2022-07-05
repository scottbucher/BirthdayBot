import {
    ApplicationCommandOptionType,
    RESTPostAPIChatInputApplicationCommandsJSONBody,
} from 'discord-api-types/v10';
import { CommandInteraction, Permissions, PermissionString } from 'discord.js';

import { EventData } from '../models/index.js';
import { Lang } from '../services/index.js';
import { CommandUtils } from '../utils/index.js';
import { Command, CommandDeferType } from './index.js';

export class ConfigCommand implements Command {
    public metadata: RESTPostAPIChatInputApplicationCommandsJSONBody = {
        name: Lang.getCom('commands.config'),
        description: 'Manage config settings.',
        dm_permission: false,
        default_member_permissions: Permissions.resolve([
            Permissions.FLAGS.ADMINISTRATOR,
        ]).toString(),
        options: [
            {
                name: Lang.getCom('arguments.setting'),
                description: `Change Birthday Bot's config settings.`,
                type: ApplicationCommandOptionType.String.valueOf(),
                required: true,
                choices: [
                    {
                        name: Lang.getCom('settingType.nameFormat'),
                        value: Lang.getCom('settingType.nameFormat'),
                    },
                    {
                        name: Lang.getCom('settingType.timeZone'),
                        value: Lang.getCom('settingType.timeZone'),
                    },
                    {
                        name: Lang.getCom('settingType.useTimezone'),
                        value: Lang.getCom('settingType.useTimezone'),
                    },
                    {
                        name: Lang.getCom('settingType.dateFormat'),
                        value: Lang.getCom('settingType.dateFormat'),
                    },
                    {
                        name: Lang.getCom('settingType.trustedPreventsMessage'),
                        value: Lang.getCom('settingType.trustedPreventsMessage'),
                    },
                    {
                        name: Lang.getCom('settingType.trustedPreventsRole'),
                        value: Lang.getCom('settingType.trustedPreventsRole'),
                    },
                    {
                        name: Lang.getCom('settingType.requireAllTrustedRoles'),
                        value: Lang.getCom('settingType.requireAllTrustedRoles'),
                    },
                    {
                        name: Lang.getCom('settingType.channel'),
                        value: Lang.getCom('settingType.channel'),
                    },
                    {
                        name: Lang.getCom('settingType.role'),
                        value: Lang.getCom('settingType.role'),
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
    public deferType = CommandDeferType.PUBLIC;
    public requireDev = false;
    public requireClientPerms: PermissionString[] = [];
    public requireSetup = true;
    public requireVote = false;
    public requirePremium = false;

    constructor(private commands: Command[]) {}

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        let command = CommandUtils.findCommand(
            this.commands,
            intr.options.getString(Lang.getCom('arguments.setting'))
        );
        if (!command) {
            // TODO: Should we log error here?
            return;
        }

        let passesChecks = await CommandUtils.runChecks(command, intr, data);
        if (passesChecks) {
            await command.execute(intr, data);
        }
    }
}
