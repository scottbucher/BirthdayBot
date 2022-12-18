import { Locale, PermissionsString } from 'discord.js';

import { Lang } from '../../services/index.js';

interface PermissionData {
    displayName(langCode: Locale): string;
}

export class Permission {
    public static Data: {
        [key in PermissionsString]: PermissionData;
    } = {
        AddReactions: {
            displayName(langCode: Locale): string {
                return Lang.getRef('info', 'permissions.AddReactions', langCode);
            },
        },
        Administrator: {
            displayName(langCode: Locale): string {
                return Lang.getRef('info', 'permissions.Administrator', langCode);
            },
        },
        AttachFiles: {
            displayName(langCode: Locale): string {
                return Lang.getRef('info', 'permissions.AttachFiles', langCode);
            },
        },
        BanMembers: {
            displayName(langCode: Locale): string {
                return Lang.getRef('info', 'permissions.BanMembers', langCode);
            },
        },
        ChangeNickname: {
            displayName(langCode: Locale): string {
                return Lang.getRef('info', 'permissions.ChangeNickname', langCode);
            },
        },
        Connect: {
            displayName(langCode: Locale): string {
                return Lang.getRef('info', 'permissions.Connect', langCode);
            },
        },
        CreateInstantInvite: {
            displayName(langCode: Locale): string {
                return Lang.getRef('info', 'permissions.CreateInstantInvite', langCode);
            },
        },
        CreatePrivateThreads: {
            displayName(langCode: Locale): string {
                return Lang.getRef('info', 'permissions.CreatePrivateThreads', langCode);
            },
        },
        CreatePublicThreads: {
            displayName(langCode: Locale): string {
                return Lang.getRef('info', 'permissions.CreatePublicThreads', langCode);
            },
        },
        DeafenMembers: {
            displayName(langCode: Locale): string {
                return Lang.getRef('info', 'permissions.DeafenMembers', langCode);
            },
        },
        EmbedLinks: {
            displayName(langCode: Locale): string {
                return Lang.getRef('info', 'permissions.EmbedLinks', langCode);
            },
        },
        KickMembers: {
            displayName(langCode: Locale): string {
                return Lang.getRef('info', 'permissions.KickMembers', langCode);
            },
        },
        ManageChannels: {
            displayName(langCode: Locale): string {
                return Lang.getRef('info', 'permissions.ManageChannels', langCode);
            },
        },
        ManageEmojisAndStickers: {
            displayName(langCode: Locale): string {
                return Lang.getRef('info', 'permissions.ManageEmojisAndStickers', langCode);
            },
        },
        ManageEvents: {
            displayName(langCode: Locale): string {
                return Lang.getRef('info', 'permissions.ManageEvents', langCode);
            },
        },
        ManageGuild: {
            displayName(langCode: Locale): string {
                return Lang.getRef('info', 'permissions.ManageGuild', langCode);
            },
        },
        ManageMessages: {
            displayName(langCode: Locale): string {
                return Lang.getRef('info', 'permissions.ManageMessages', langCode);
            },
        },
        ManageNicknames: {
            displayName(langCode: Locale): string {
                return Lang.getRef('info', 'permissions.ManageNicknames', langCode);
            },
        },
        ManageRoles: {
            displayName(langCode: Locale): string {
                return Lang.getRef('info', 'permissions.ManageRoles', langCode);
            },
        },
        ManageThreads: {
            displayName(langCode: Locale): string {
                return Lang.getRef('info', 'permissions.ManageThreads', langCode);
            },
        },
        ManageWebhooks: {
            displayName(langCode: Locale): string {
                return Lang.getRef('info', 'permissions.ManageWebhooks', langCode);
            },
        },
        MentionEveryone: {
            displayName(langCode: Locale): string {
                return Lang.getRef('info', 'permissions.MentionEveryone', langCode);
            },
        },
        ModerateMembers: {
            displayName(langCode: Locale): string {
                return Lang.getRef('info', 'permissions.ModerateMembers', langCode);
            },
        },
        MoveMembers: {
            displayName(langCode: Locale): string {
                return Lang.getRef('info', 'permissions.MoveMembers', langCode);
            },
        },
        MuteMembers: {
            displayName(langCode: Locale): string {
                return Lang.getRef('info', 'permissions.MuteMembers', langCode);
            },
        },
        PrioritySpeaker: {
            displayName(langCode: Locale): string {
                return Lang.getRef('info', 'permissions.PrioritySpeaker', langCode);
            },
        },
        ReadMessageHistory: {
            displayName(langCode: Locale): string {
                return Lang.getRef('info', 'permissions.ReadMessageHistory', langCode);
            },
        },
        RequestToSpeak: {
            displayName(langCode: Locale): string {
                return Lang.getRef('info', 'permissions.RequestToSpeak', langCode);
            },
        },
        SendMessages: {
            displayName(langCode: Locale): string {
                return Lang.getRef('info', 'permissions.SendMessages', langCode);
            },
        },
        SendMessagesInThreads: {
            displayName(langCode: Locale): string {
                return Lang.getRef('info', 'permissions.SendMessagesInThreads', langCode);
            },
        },
        SendTTSMessages: {
            displayName(langCode: Locale): string {
                return Lang.getRef('info', 'permissions.SendTTSMessages', langCode);
            },
        },
        Speak: {
            displayName(langCode: Locale): string {
                return Lang.getRef('info', 'permissions.Speak', langCode);
            },
        },
        Stream: {
            displayName(langCode: Locale): string {
                return Lang.getRef('info', 'permissions.Stream', langCode);
            },
        },
        UseApplicationCommands: {
            displayName(langCode: Locale): string {
                return Lang.getRef('info', 'permissions.UseApplicationCommands', langCode);
            },
        },
        UseEmbeddedActivities: {
            displayName(langCode: Locale): string {
                return Lang.getRef('info', 'permissions.UseEmbeddedActivities', langCode);
            },
        },
        UseExternalEmojis: {
            displayName(langCode: Locale): string {
                return Lang.getRef('info', 'permissions.UseExternalEmojis', langCode);
            },
        },
        UseExternalStickers: {
            displayName(langCode: Locale): string {
                return Lang.getRef('info', 'permissions.UseExternalStickers', langCode);
            },
        },
        UseVAD: {
            displayName(langCode: Locale): string {
                return Lang.getRef('info', 'permissions.UseVAD', langCode);
            },
        },
        ViewAuditLog: {
            displayName(langCode: Locale): string {
                return Lang.getRef('info', 'permissions.ViewAuditLog', langCode);
            },
        },
        ViewChannel: {
            displayName(langCode: Locale): string {
                return Lang.getRef('info', 'permissions.ViewChannel', langCode);
            },
        },
        ViewGuildInsights: {
            displayName(langCode: Locale): string {
                return Lang.getRef('info', 'permissions.ViewGuildInsights', langCode);
            },
        },
    };
}
