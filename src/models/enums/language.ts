import { Lang } from '../../services/lang';

export enum LangCode {
    EN = 'EN',
}

interface LanguageData {
    display(langCode: LangCode): string;
    regex: RegExp;
}

export class Language {
    public static Data: {
        [key in LangCode]: LanguageData;
    } = {
        EN: {
            display(langCode: LangCode): string {
                return Lang.getRef('languageName', langCode);
            },
            regex: /\b(en|english)\b/i,
        },
    };

    public static find(input: string): LangCode {
        for (let [option, data] of Object.entries(this.Data)) {
            if (data.regex.test(input)) {
                return LangCode[option];
            }
        }
    }
}
