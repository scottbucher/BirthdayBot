import {
    ApplicationCommandType,
    RESTPostAPIChatInputApplicationCommandsJSONBody,
    RESTPostAPIContextMenuApplicationCommandsJSONBody,
} from 'discord.js';

import { Language } from '../models/enum-helpers/language.js';
import { Lang } from '../services/index.js';
import { Args } from './args.js';

export const ChatCommandMetadata: {
    [command: string]: RESTPostAPIChatInputApplicationCommandsJSONBody;
} = {
    VIEW: {
        name: Lang.getRef('commands', 'chatCommands.view', Language.Default),
        type: ApplicationCommandType.ChatInput,
        description: Lang.getRef('commands', 'commandDescs.view', Language.Default),
        dm_permission: true,
        default_member_permissions: undefined,
        options: [
            {
                ...Args.VIEW_TYPE_OPTION,
                required: false,
            },
            {
                ...Args.VIEW_USER_OPTION,
                required: false,
            },
        ],
    },
    INFO: {
        name: Lang.getRef('commands', 'chatCommands.info', Language.Default),
        type: ApplicationCommandType.ChatInput,
        description: Lang.getRef('commands', 'commandDescs.info', Language.Default),
        dm_permission: true,
        default_member_permissions: undefined,
        options: [
            {
                ...Args.INFO_OPTION,
                required: true,
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
