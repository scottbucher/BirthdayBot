import { Locale, LocalizationMap } from 'discord.js';

import { HelpOption } from '../../enums/index.js';
import { Lang } from '../../services/index.js';

interface HelpOptionData {
    displayName(langCode: Locale): string;
    localizationMap(): LocalizationMap;
}

export class HelpOptionHelper {
    public static Data: {
        [key in HelpOption]: HelpOptionData;
    } = {
        GENERAL: {
            displayName(langCode: Locale): string {
                return Lang.getRef('commands', 'helpChoiceDescs.general', langCode);
            },
            localizationMap(): LocalizationMap {
                return Lang.getRefLocalizationMap('commands', 'helpChoiceDescs.general');
            },
        },
        BLACKLIST: {
            displayName(langCode: Locale): string {
                return Lang.getRef('commands', 'helpChoiceDescs.blacklist', langCode);
            },
            localizationMap(): LocalizationMap {
                return Lang.getRefLocalizationMap('commands', 'helpChoiceDescs.blacklist');
            },
        },
        CONFIG: {
            displayName(langCode: Locale): string {
                return Lang.getRef('commands', 'helpChoiceDescs.config', langCode);
            },
            localizationMap(): LocalizationMap {
                return Lang.getRefLocalizationMap('commands', 'helpChoiceDescs.config');
            },
        },
        MESSAGE: {
            displayName(langCode: Locale): string {
                return Lang.getRef('commands', 'helpChoiceDescs.message', langCode);
            },
            localizationMap(): LocalizationMap {
                return Lang.getRefLocalizationMap('commands', 'helpChoiceDescs.message');
            },
        },
        TRUSTED_ROLE: {
            displayName(langCode: Locale): string {
                return Lang.getRef('commands', 'helpChoiceDescs.trustedRole', langCode);
            },
            localizationMap(): LocalizationMap {
                return Lang.getRefLocalizationMap('commands', 'helpChoiceDescs.trustedRole');
            },
        },
        EVENT: {
            displayName(langCode: Locale): string {
                return Lang.getRef('commands', 'helpChoiceDescs.event', langCode);
            },
            localizationMap(): LocalizationMap {
                return Lang.getRefLocalizationMap('commands', 'helpChoiceDescs.event');
            },
        },
        MEMBER_ANNIVERSARY_ROLE: {
            displayName(langCode: Locale): string {
                return Lang.getRef('commands', 'helpChoiceDescs.mar', langCode);
            },
            localizationMap(): LocalizationMap {
                return Lang.getRefLocalizationMap('commands', 'helpChoiceDescs.mar');
            },
        },
        PREMIUM: {
            displayName(langCode: Locale): string {
                return Lang.getRef('commands', 'helpChoiceDescs.premium', langCode);
            },
            localizationMap(): LocalizationMap {
                return Lang.getRefLocalizationMap('commands', 'helpChoiceDescs.premium');
            },
        },
        PERMISSIONS: {
            displayName(langCode: Locale): string {
                return Lang.getRef('commands', 'helpChoiceDescs.permissions', langCode);
            },
            localizationMap(): LocalizationMap {
                return Lang.getRefLocalizationMap('commands', 'helpChoiceDescs.permissions');
            },
        },
    };
}
