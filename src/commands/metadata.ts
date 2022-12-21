import {
    ApplicationCommandType,
    PermissionFlagsBits,
    PermissionsBitField,
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
                ...Args.USER_OPTION,
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
    LINK: {
        name: Lang.getRef('commands', 'chatCommands.link', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('commands', 'chatCommands.link'),
        description: Lang.getRef('commands', 'commandDescs.link', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('commands', 'commandDescs.link'),
        dm_permission: true,
        default_member_permissions: undefined,
        options: [
            {
                ...Args.LINK_OPTION,
                required: true,
            },
        ],
    },
    LIST: {
        name: Lang.getRef('commands', 'chatCommands.list', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('commands', 'chatCommands.list'),
        description: Lang.getRef('commands', 'commandDescs.list', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('commands', 'commandDescs.list'),
        dm_permission: false,
        default_member_permissions: undefined,
        options: [
            {
                ...Args.LIST_TYPE_OPTION,
                required: false,
            },
            {
                ...Args.PAGE_OPTION,
                required: false,
            },
        ],
    },
    MAP: {
        name: Lang.getRef('commands', 'chatCommands.map', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('commands', 'chatCommands.map'),
        description: Lang.getRef('commands', 'commandDescs.map', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('commands', 'commandDescs.map'),
        dm_permission: true,
        default_member_permissions: undefined,
    },
    NEXT: {
        name: Lang.getRef('commands', 'chatCommands.next', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('commands', 'chatCommands.next'),
        description: Lang.getRef('commands', 'commandDescs.next', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('commands', 'commandDescs.next'),
        dm_permission: false,
        default_member_permissions: undefined,
        options: [
            {
                ...Args.NEXT_CELEBRATION_TYPE_OPTION,
                required: false,
            },
        ],
    },
    PREMIUM: {
        name: Lang.getRef('commands', 'chatCommands.premium', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('commands', 'chatCommands.premium'),
        description: Lang.getRef('commands', 'commandDescs.premium', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('commands', 'commandDescs.premium'),
        dm_permission: true,
        default_member_permissions: undefined,
    },
    PURGE: {
        name: Lang.getRef('commands', 'chatCommands.purge', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('commands', 'chatCommands.purge'),
        description: Lang.getRef('commands', 'commandDescs.purge', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('commands', 'commandDescs.purge'),
        dm_permission: true,
        default_member_permissions: undefined,
    },
    SET: {
        name: Lang.getRef('commands', 'chatCommands.set', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('commands', 'chatCommands.set'),
        description: Lang.getRef('commands', 'commandDescs.set', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('commands', 'commandDescs.set'),
        dm_permission: true,
        default_member_permissions: undefined,
        options: [
            {
                ...Args.DATE_OPTION,
                required: false,
            },
            {
                ...Args.TIME_ZONE_OPTION,
                required: false,
            },
        ],
    },
    SUBSCRIBE: {
        name: Lang.getRef('commands', 'chatCommands.subscribe', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('commands', 'chatCommands.subscribe'),
        description: Lang.getRef('commands', 'commandDescs.subscribe', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('commands', 'commandDescs.subscribe'),
        dm_permission: false,
        default_member_permissions: undefined,
    },
    SUGGEST: {
        name: Lang.getRef('commands', 'chatCommands.suggest', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('commands', 'chatCommands.suggest'),
        description: Lang.getRef('commands', 'commandDescs.suggest', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('commands', 'commandDescs.suggest'),
        dm_permission: false,
        default_member_permissions: PermissionsBitField.resolve([
            PermissionFlagsBits.ManageGuild,
        ]).toString(),
        options: [
            {
                ...Args.USER_OPTION,
                required: true,
            },
            {
                ...Args.DATE_OPTION,
                required: false,
            },
            {
                ...Args.TIME_ZONE_OPTION,
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
