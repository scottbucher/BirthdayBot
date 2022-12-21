import { Locale, LocalizationMap } from 'discord.js';

import { PostMode } from '../../enums/index.js';
import { Lang } from '../../services/index.js';

interface PostModeData {
    displayName(langCode: Locale): string;
    localizationMap(): LocalizationMap;
}

export class PostModeHelper {
    public static Data: {
        [key in PostMode]: PostModeData;
    } = {
        POST_ONLY: {
            displayName(langCode: Locale): string {
                return Lang.getRef('commands', 'postModeChoices.postOnly', langCode);
            },
            localizationMap(): LocalizationMap {
                return Lang.getRefLocalizationMap('commands', 'postModeChoices.postOnly');
            },
        },
        POST_AND_PIN: {
            displayName(langCode: Locale): string {
                return Lang.getRef('commands', 'postModeChoices.postPin', langCode);
            },
            localizationMap(): LocalizationMap {
                return Lang.getRefLocalizationMap('commands', 'postModeChoices.postPin');
            },
        },
        THREADS: {
            displayName(langCode: Locale): string {
                return Lang.getRef('commands', 'postModeChoices.threads', langCode);
            },
            localizationMap(): LocalizationMap {
                return Lang.getRefLocalizationMap('commands', 'postModeChoices.threads');
            },
        },
    };
}
