import { PermissionsString } from 'discord.js';

import { LangCode } from '../../enums/lang-code.js';
import { Lang } from '../../services/index.js';

interface PermissionData {
    displayName(langCode: LangCode): string;
}

export class Permission {
    public static Data: {
        [key in PermissionsString]: PermissionData;
    } = {
        AddReactions: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.AddReactions', langCode);
            },
        },
        Administrator: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.Administrator', langCode);
            },
        },
        AttachFiles: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.AttachFiles', langCode);
            },
        },
        BanMembers: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.BanMembers', langCode);
            },
        },
        ChangeNickname: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.ChangeNickname', langCode);
            },
        },
        Connect: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.Connect', langCode);
            },
        },
        CreateInstantInvite: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.CreateInstantInvite', langCode);
            },
        },
        CreatePrivateThreads: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.CreatePrivateThreads', langCode);
            },
        },
        CreatePublicThreads: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.CreatePublicThreads', langCode);
            },
        },
        DeafenMembers: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.DeafenMembers', langCode);
            },
        },
        EmbedLinks: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.EmbedLinks', langCode);
            },
        },
        KickMembers: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.KickMembers', langCode);
            },
        },
        ManageChannels: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.ManageChannels', langCode);
            },
        },
        ManageEmojisAndStickers: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.ManageEmojisAndStickers', langCode);
            },
        },
        ManageEvents: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.ManageEvents', langCode);
            },
        },
        ManageGuild: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.ManageGuild', langCode);
            },
        },
        ManageMessages: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.ManageMessages', langCode);
            },
        },
        ManageNicknames: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.ManageNicknames', langCode);
            },
        },
        ManageRoles: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.ManageRoles', langCode);
            },
        },
        ManageThreads: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.ManageThreads', langCode);
            },
        },
        ManageWebhooks: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.ManageWebhooks', langCode);
            },
        },
        MentionEveryone: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.MentionEveryone', langCode);
            },
        },
        ModerateMembers: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.ModerateMembers', langCode);
            },
        },
        MoveMembers: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.MoveMembers', langCode);
            },
        },
        MuteMembers: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.MuteMembers', langCode);
            },
        },
        PrioritySpeaker: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.PrioritySpeaker', langCode);
            },
        },
        ReadMessageHistory: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.ReadMessageHistory', langCode);
            },
        },
        RequestToSpeak: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.RequestToSpeak', langCode);
            },
        },
        SendMessages: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.SendMessages', langCode);
            },
        },
        SendMessagesInThreads: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.SendMessagesInThreads', langCode);
            },
        },
        SendTTSMessages: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.SendTTSMessages', langCode);
            },
        },
        Speak: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.Speak', langCode);
            },
        },
        Stream: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.Stream', langCode);
            },
        },
        UseApplicationCommands: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.UseApplicationCommands', langCode);
            },
        },
        UseEmbeddedActivities: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.UseEmbeddedActivities', langCode);
            },
        },
        UseExternalEmojis: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.UseExternalEmojis', langCode);
            },
        },
        UseExternalStickers: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.UseExternalStickers', langCode);
            },
        },
        UseVAD: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.UseVAD', langCode);
            },
        },
        ViewAuditLog: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.ViewAuditLog', langCode);
            },
        },
        ViewChannel: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.ViewChannel', langCode);
            },
        },
        ViewGuildInsights: {
            displayName(langCode: LangCode): string {
                return Lang.getRef('info', 'permissions.ViewGuildInsights', langCode);
            },
        },
    };
}
