import { Locale, LocalizationMap } from 'discord.js';

import { UseTimeZone } from '../../enums/index.js';
import { Lang } from '../../services/index.js';

interface UseTimeZoneData {
    displayName(langCode: Locale): string;
    localizationMap(): LocalizationMap;
}

export class UseTimeZoneHelper {
    public static Data: {
        [key in UseTimeZone]: UseTimeZoneData;
    } = {
        SERVER: {
            displayName(langCode: Locale): string {
                return Lang.getRef('commands', 'useTimeZoneChoices.server', langCode);
            },
            localizationMap(): LocalizationMap {
                return Lang.getRefLocalizationMap('commands', 'useTimeZoneChoices.server');
            },
        },
        USER: {
            displayName(langCode: Locale): string {
                return Lang.getRef('commands', 'useTimeZoneChoices.user', langCode);
            },
            localizationMap(): LocalizationMap {
                return Lang.getRefLocalizationMap('commands', 'useTimeZoneChoices.user');
            },
        },
    };
}
