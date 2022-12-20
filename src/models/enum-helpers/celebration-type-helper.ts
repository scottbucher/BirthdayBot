import { Locale, LocalizationMap } from 'discord.js';

import {
    CelebrationType,
    ListCelebrationType,
    MessageListCelebrationType,
    ViewCelebrationType,
} from '../../enums/index.js';
import { Lang } from '../../services/index.js';

interface CelebrationTypeData {
    displayName(langCode: Locale): string;
    localizationMap(): LocalizationMap;
}

export class CelebrationTypeHelper {
    public static Data: {
        [key in CelebrationType]: CelebrationTypeData;
    } = {
        BIRTHDAY: {
            displayName(langCode: Locale): string {
                return Lang.getRef('commands', 'celebrationTypeChoices.birthday', langCode);
            },
            localizationMap(): LocalizationMap {
                return Lang.getRefLocalizationMap('commands', 'celebrationTypeChoices.birthday');
            },
        },
        MEMBER_ANNIVERSARY: {
            displayName(langCode: Locale): string {
                return Lang.getRef(
                    'commands',
                    'celebrationTypeChoices.memberAnniversary',
                    langCode
                );
            },
            localizationMap(): LocalizationMap {
                return Lang.getRefLocalizationMap(
                    'commands',
                    'celebrationTypeChoices.memberAnniversary'
                );
            },
        },
        SERVER_ANNIVERSARY: {
            displayName(langCode: Locale): string {
                return Lang.getRef(
                    'commands',
                    'celebrationTypeChoices.serverAnniversary',
                    langCode
                );
            },
            localizationMap(): LocalizationMap {
                return Lang.getRefLocalizationMap(
                    'commands',
                    'celebrationTypeChoices.serverAnniversary'
                );
            },
        },
        EVENT: {
            displayName(langCode: Locale): string {
                return Lang.getRef('commands', 'celebrationTypeChoices.event', langCode);
            },
            localizationMap(): LocalizationMap {
                return Lang.getRefLocalizationMap('commands', 'celebrationTypeChoices.event');
            },
        },
    };
}

export class ListCelebrationTypeHelper {
    public static Data: {
        [key in ListCelebrationType]: CelebrationTypeData;
    } = {
        BIRTHDAY: {
            displayName(langCode: Locale): string {
                return Lang.getRef('commands', 'celebrationTypeChoices.birthday', langCode);
            },
            localizationMap(): LocalizationMap {
                return Lang.getRefLocalizationMap('commands', 'celebrationTypeChoices.birthday');
            },
        },
        MEMBER_ANNIVERSARY: {
            displayName(langCode: Locale): string {
                return Lang.getRef(
                    'commands',
                    'celebrationTypeChoices.memberAnniversary',
                    langCode
                );
            },
            localizationMap(): LocalizationMap {
                return Lang.getRefLocalizationMap(
                    'commands',
                    'celebrationTypeChoices.memberAnniversary'
                );
            },
        },
    };
}

export class ViewCelebrationTypeHelper {
    public static Data: {
        [key in ViewCelebrationType]: CelebrationTypeData;
    } = {
        BIRTHDAY: {
            displayName(langCode: Locale): string {
                return Lang.getRef('commands', 'celebrationTypeChoices.birthday', langCode);
            },
            localizationMap(): LocalizationMap {
                return Lang.getRefLocalizationMap('commands', 'celebrationTypeChoices.birthday');
            },
        },
        MEMBER_ANNIVERSARY: {
            displayName(langCode: Locale): string {
                return Lang.getRef(
                    'commands',
                    'celebrationTypeChoices.memberAnniversary',
                    langCode
                );
            },
            localizationMap(): LocalizationMap {
                return Lang.getRefLocalizationMap(
                    'commands',
                    'celebrationTypeChoices.memberAnniversary'
                );
            },
        },
    };
}

export class MessageListCelebrationTypeHelper {
    public static Data: {
        [key in MessageListCelebrationType]: CelebrationTypeData;
    } = {
        BIRTHDAY: {
            displayName(langCode: Locale): string {
                return Lang.getRef('commands', 'celebrationTypeChoices.birthday', langCode);
            },
            localizationMap(): LocalizationMap {
                return Lang.getRefLocalizationMap('commands', 'celebrationTypeChoices.birthday');
            },
        },
        MEMBER_ANNIVERSARY: {
            displayName(langCode: Locale): string {
                return Lang.getRef(
                    'commands',
                    'celebrationTypeChoices.memberAnniversary',
                    langCode
                );
            },
            localizationMap(): LocalizationMap {
                return Lang.getRefLocalizationMap(
                    'commands',
                    'celebrationTypeChoices.memberAnniversary'
                );
            },
        },
        SERVER_ANNIVERSARY: {
            displayName(langCode: Locale): string {
                return Lang.getRef(
                    'commands',
                    'celebrationTypeChoices.serverAnniversary',
                    langCode
                );
            },
            localizationMap(): LocalizationMap {
                return Lang.getRefLocalizationMap(
                    'commands',
                    'celebrationTypeChoices.serverAnniversary'
                );
            },
        },
        USER_SPECIFIC_BIRTHDAY: {
            displayName(langCode: Locale): string {
                return Lang.getRef(
                    'commands',
                    'celebrationTypeChoices.userSpecificBirthday',
                    langCode
                );
            },
            localizationMap(): LocalizationMap {
                return Lang.getRefLocalizationMap(
                    'commands',
                    'celebrationTypeChoices.userSpecificBirthday'
                );
            },
        },
        USER_SPECIFIC_MEMBER_ANNIVERSARY: {
            displayName(langCode: Locale): string {
                return Lang.getRef(
                    'commands',
                    'celebrationTypeChoices.userSpecificMemberAnniversary',
                    langCode
                );
            },
            localizationMap(): LocalizationMap {
                return Lang.getRefLocalizationMap(
                    'commands',
                    'celebrationTypeChoices.userSpecificMemberAnniversary'
                );
            },
        },
    };
}
