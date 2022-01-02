import { Lang } from '../../services';
import { LangCode } from '.';
import { PermissionString } from 'discord.js';

interface PermissionData {
    displayName(langCode: LangCode): string;
}

export class Permission {
    public static Data: {
        [key in PermissionString]: PermissionData;
    } = {
        ADD_REACTIONS: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.ADD_REACTIONS', langCode);
            },
        },
        ADMINISTRATOR: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.ADMINISTRATOR', langCode);
            },
        },
        ATTACH_FILES: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.ATTACH_FILES', langCode);
            },
        },
        BAN_MEMBERS: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.BAN_MEMBERS', langCode);
            },
        },
        CHANGE_NICKNAME: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.CHANGE_NICKNAME', langCode);
            },
        },
        CONNECT: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.CONNECT', langCode);
            },
        },
        CREATE_INSTANT_INVITE: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.CREATE_INSTANT_INVITE', langCode);
            },
        },
        CREATE_PRIVATE_THREADS: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.CREATE_PRIVATE_THREADS', langCode);
            },
        },
        CREATE_PUBLIC_THREADS: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.CREATE_PUBLIC_THREADS', langCode);
            },
        },
        DEAFEN_MEMBERS: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.DEAFEN_MEMBERS', langCode);
            },
        },
        EMBED_LINKS: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.EMBED_LINKS', langCode);
            },
        },
        KICK_MEMBERS: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.KICK_MEMBERS', langCode);
            },
        },
        MANAGE_CHANNELS: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.MANAGE_CHANNELS', langCode);
            },
        },
        MANAGE_EMOJIS_AND_STICKERS: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.MANAGE_EMOJIS_AND_STICKERS', langCode);
            },
        },
        MANAGE_EVENTS: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.MANAGE_EVENTS', langCode);
            },
        },
        MANAGE_GUILD: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.MANAGE_GUILD', langCode);
            },
        },
        MANAGE_MESSAGES: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.MANAGE_MESSAGES', langCode);
            },
        },
        MANAGE_NICKNAMES: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.MANAGE_NICKNAMES', langCode);
            },
        },
        MANAGE_ROLES: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.MANAGE_ROLES', langCode);
            },
        },
        MANAGE_THREADS: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.MANAGE_THREADS', langCode);
            },
        },
        MANAGE_WEBHOOKS: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.MANAGE_WEBHOOKS', langCode);
            },
        },
        MENTION_EVERYONE: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.MENTION_EVERYONE', langCode);
            },
        },
        MODERATE_MEMBERS: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.MODERATE_MEMBERS', langCode);
            },
        },
        MOVE_MEMBERS: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.MOVE_MEMBERS', langCode);
            },
        },
        MUTE_MEMBERS: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.MUTE_MEMBERS', langCode);
            },
        },
        PRIORITY_SPEAKER: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.PRIORITY_SPEAKER', langCode);
            },
        },
        READ_MESSAGE_HISTORY: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.READ_MESSAGE_HISTORY', langCode);
            },
        },
        REQUEST_TO_SPEAK: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.REQUEST_TO_SPEAK', langCode);
            },
        },
        SEND_MESSAGES: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.SEND_MESSAGES', langCode);
            },
        },
        SEND_MESSAGES_IN_THREADS: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.SEND_MESSAGES_IN_THREADS', langCode);
            },
        },
        SEND_TTS_MESSAGES: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.SEND_TTS_MESSAGES', langCode);
            },
        },
        SPEAK: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.SPEAK', langCode);
            },
        },
        START_EMBEDDED_ACTIVITIES: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.START_EMBEDDED_ACTIVITIES', langCode);
            },
        },
        STREAM: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.STREAM', langCode);
            },
        },
        USE_APPLICATION_COMMANDS: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.USE_APPLICATION_COMMANDS', langCode);
            },
        },
        USE_EXTERNAL_EMOJIS: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.USE_EXTERNAL_EMOJIS', langCode);
            },
        },
        USE_EXTERNAL_STICKERS: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.USE_EXTERNAL_STICKERS', langCode);
            },
        },
        USE_PRIVATE_THREADS: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.USE_PRIVATE_THREADS', langCode);
            },
        },
        USE_PUBLIC_THREADS: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.USE_PUBLIC_THREADS', langCode);
            },
        },
        USE_VAD: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.USE_VAD', langCode);
            },
        },
        VIEW_AUDIT_LOG: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.VIEW_AUDIT_LOG', langCode);
            },
        },
        VIEW_CHANNEL: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.VIEW_CHANNEL', langCode);
            },
        },
        VIEW_GUILD_INSIGHTS: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.VIEW_GUILD_INSIGHTS', langCode);
            },
        },
    };
}
