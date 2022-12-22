import { Locale, LocalizationMap } from 'discord.js';

import { SettingsOption } from '../../enums/index.js';
import { Lang } from '../../services/index.js';

interface SettingsOptionData {
    displayName(langCode: Locale): string;
    localizationMap(): LocalizationMap;
}

export class SettingsOptionHelper {
    public static Data: {
        [key in SettingsOption]: SettingsOptionData;
    } = {
        GENERAL: {
            displayName(langCode: Locale): string {
                return Lang.getRef('commands', 'settingsChoice.general', langCode);
            },
            localizationMap(): LocalizationMap {
                return Lang.getRefLocalizationMap('commands', 'settingsChoice.general');
            },
        },
        MESSAGE: {
            displayName(langCode: Locale): string {
                return Lang.getRef('commands', 'settingsChoice.message', langCode);
            },
            localizationMap(): LocalizationMap {
                return Lang.getRefLocalizationMap('commands', 'settingsChoice.message');
            },
        },
        ADVANCED: {
            displayName(langCode: Locale): string {
                return Lang.getRef('commands', 'settingsChoice.advanced', langCode);
            },
            localizationMap(): LocalizationMap {
                return Lang.getRefLocalizationMap('commands', 'settingsChoice.advanced');
            },
        },
    };
}
