import { ApplicationCommandOptionType } from 'discord-api-types/payloads/v9';
import { ApplicationCommandData, CommandInteraction, PermissionString } from 'discord.js';

import { EventData } from '../models/internal-models';
import { Lang } from '../services';
import { CommandUtils } from '../utils';
import { Command } from './command';

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
    public requireClientPerms: PermissionString[] = [];
    public requireUserPerms: PermissionString[] = [];
    public requireSetup = true;
    public requireVote = false;
    public requirePremium = false;

    constructor(private commands: Command[]) {}

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        let command = CommandUtils.findCommand(this.commands, intr.options.getSubcommand());
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
