import { Locale, LocalizationMap } from 'discord.js';

import { DateFormat } from '../../enums/index.js';
import { Lang } from '../../services/index.js';

interface DateFormatData {
    displayName(langCode: Locale): string;
    localizationMap(): LocalizationMap;
}

export class DateFormatHelper {
    public static Data: {
        [key in DateFormat]: DateFormatData;
    } = {
        MONTH_DAY: {
            displayName(langCode: Locale): string {
                return Lang.getRef('commands', 'dateFormatChoices.monthDay', langCode);
            },
            localizationMap(): LocalizationMap {
                return Lang.getRefLocalizationMap('commands', 'dateFormatChoices.monthDay');
            },
        },
        DAY_MONTH: {
            displayName(langCode: Locale): string {
                return Lang.getRef('commands', 'dateFormatChoices.dayMonth', langCode);
            },
            localizationMap(): LocalizationMap {
                return Lang.getRefLocalizationMap('commands', 'dateFormatChoices.dayMonth');
            },
        },
    };
}
