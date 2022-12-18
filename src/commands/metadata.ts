import {
    ApplicationCommandOptionType,
    ApplicationCommandType,
    RESTPostAPIChatInputApplicationCommandsJSONBody,
    RESTPostAPIContextMenuApplicationCommandsJSONBody,
} from 'discord.js';

import { Language } from '../models/enum-helpers/language.js';
import { Lang } from '../services/index.js';

export const ChatCommandMetadata: {
    [command: string]: RESTPostAPIChatInputApplicationCommandsJSONBody;
} = {
    VIEW: {
        name: Lang.getRef('commands', 'chatCommands.view', Language.Default),
        type: ApplicationCommandType.ChatInput,
        description: `View your, or someone else's birthday or anniversary. Or view the server's anniversary.`,
        dm_permission: true,
        default_member_permissions: undefined,
        options: [
            {
                name: Lang.getRef('commands', 'arguments.type', Language.Default),
                name_localizations: Lang.getRefLocalizationMap('commands', 'arguments.type'),
                description: Lang.getRef('commands', 'argDescs.viewType', Language.Default),
                description_localizations: Lang.getRefLocalizationMap(
                    'commands',
                    'argDescs.viewType'
                ),
                type: ApplicationCommandOptionType.String.valueOf(),
                required: false,
                choices: [
                    {
                        name: 'birthday',
                        value: 'birthday',
                    },
                    {
                        name: 'memberAnniversary',
                        value: 'member_anniversary',
                    },
                ],
            },
            {
                name: Lang.getRef('commands', 'arguments.user', Language.Default),
                name_localizations: Lang.getRefLocalizationMap('commands', 'arguments.user'),
                description: Lang.getRef('commands', 'argDescs.viewUserOption', Language.Default),
                description_localizations: Lang.getRefLocalizationMap(
                    'commands',
                    'argDescs.viewUserOption'
                ),
                type: ApplicationCommandOptionType.User.valueOf(),
                required: false,
            },
        ],
    },
};

export const MessageCommandMetadata: {
    [command: string]: RESTPostAPIContextMenuApplicationCommandsJSONBody;
} = {};

export const UserCommandMetadata: {
    [command: string]: RESTPostAPIContextMenuApplicationCommandsJSONBody;
} = {
    VIEW_BIRTHDAY: {
        type: ApplicationCommandType.User,
        name: Lang.getRef('commands', 'userCommands.viewBirthday', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('commands', 'userCommands.viewBirthday'),
        default_member_permissions: undefined,
        dm_permission: true,
    },
    VIEW_ANNIVERSARY: {
        type: ApplicationCommandType.User,
        name: Lang.getRef('commands', 'userCommands.viewAnniversary', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('commands', 'userCommands.viewAnniversary'),
        default_member_permissions: undefined,
        dm_permission: true,
    },
};
