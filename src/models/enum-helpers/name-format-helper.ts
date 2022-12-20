import { Locale, LocalizationMap } from 'discord.js';

import { NameFormat } from '../../enums/index.js';
import { Lang } from '../../services/index.js';

interface NameFormatData {
    displayName(langCode: Locale): string;
    localizationMap(): LocalizationMap;
}

export class NameFormatHelper {
    public static Data: {
        [key in NameFormat]: NameFormatData;
    } = {
        MENTION: {
            displayName(langCode: Locale): string {
                return Lang.getRef('commands', 'nameFormatChoices.mention', langCode);
            },
            localizationMap(): LocalizationMap {
                return Lang.getRefLocalizationMap('commands', 'nameFormatChoices.mention');
            },
        },
        USERNAME: {
            displayName(langCode: Locale): string {
                return Lang.getRef('commands', 'nameFormatChoices.username', langCode);
            },
            localizationMap(): LocalizationMap {
                return Lang.getRefLocalizationMap('commands', 'nameFormatChoices.username');
            },
        },
        NICKNAME: {
            displayName(langCode: Locale): string {
                return Lang.getRef('commands', 'nameFormatChoices.nickname', langCode);
            },
            localizationMap(): LocalizationMap {
                return Lang.getRefLocalizationMap('commands', 'nameFormatChoices.nickname');
            },
        },
        TAG: {
            displayName(langCode: Locale): string {
                return Lang.getRef('commands', 'nameFormatChoices.tag', langCode);
            },
            localizationMap(): LocalizationMap {
                return Lang.getRefLocalizationMap('commands', 'nameFormatChoices.tag');
            },
        },
    };
}
