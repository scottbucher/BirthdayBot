import { Locale, LocalizationMap } from 'discord.js';

import { LinkOption } from '../../enums/index.js';
import { Lang } from '../../services/index.js';

interface LinkOptionData {
    displayName(langCode: Locale): string;
    localizationMap(): LocalizationMap;
}

export class LinkOptionHelper {
    public static Data: {
        [key in LinkOption]: LinkOptionData;
    } = {
        DOCS: {
            displayName(langCode: Locale): string {
                return Lang.getRef('commands', 'linkChoices.docs', langCode);
            },
            localizationMap(): LocalizationMap {
                return Lang.getRefLocalizationMap('commands', 'linkChoices.docs');
            },
        },
        FAQ: {
            displayName(langCode: Locale): string {
                return Lang.getRef('commands', 'linkChoices.faq', langCode);
            },
            localizationMap(): LocalizationMap {
                return Lang.getRefLocalizationMap('commands', 'linkChoices.faq');
            },
        },
        DONATE: {
            displayName(langCode: Locale): string {
                return Lang.getRef('commands', 'linkChoices.donate', langCode);
            },
            localizationMap(): LocalizationMap {
                return Lang.getRefLocalizationMap('commands', 'linkChoices.donate');
            },
        },
        INVITE: {
            displayName(langCode: Locale): string {
                return Lang.getRef('commands', 'linkChoices.invite', langCode);
            },
            localizationMap(): LocalizationMap {
                return Lang.getRefLocalizationMap('commands', 'linkChoices.invite');
            },
        },
        SUPPORT: {
            displayName(langCode: Locale): string {
                return Lang.getRef('commands', 'linkChoices.support', langCode);
            },
            localizationMap(): LocalizationMap {
                return Lang.getRefLocalizationMap('commands', 'linkChoices.support');
            },
        },
        VOTE: {
            displayName(langCode: Locale): string {
                return Lang.getRef('commands', 'linkChoices.vote', langCode);
            },
            localizationMap(): LocalizationMap {
                return Lang.getRefLocalizationMap('commands', 'linkChoices.vote');
            },
        },
        MAP: {
            displayName(langCode: Locale): string {
                return Lang.getRef('commands', 'linkChoices.map', langCode);
            },
            localizationMap(): LocalizationMap {
                return Lang.getRefLocalizationMap('commands', 'linkChoices.map');
            },
        },
    };
}
