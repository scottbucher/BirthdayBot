import { APIApplicationCommandBasicOption, ApplicationCommandOptionType } from 'discord.js';

import { HelpOption, LangCode } from '../enums/index.js';
import { Lang } from '../services/index.js';

export class Args {
    public static readonly HELP_OPTION: APIApplicationCommandBasicOption = {
        name: Lang.getRef('temp', 'arguments.option', LangCode.EN_US),
        // name_localizations: Lang.getRefLocalizationMap('arguments.option'),
        description: Lang.getRef('temp', 'argDescs.helpOption', LangCode.EN_US),
        // description_localizations: Lang.getRefLocalizationMap('argDescs.helpOption'),
        type: ApplicationCommandOptionType.String,
        choices: [
            {
                name: Lang.getRef('temp', 'helpOptions.commands', LangCode.EN_US),
                // name_localizations: Lang.getRefLocalizationMap('helpOptions.commands'),
                value: HelpOption.COMMANDS,
            },
            {
                name: Lang.getRef('temp', 'helpOptions.permissions', LangCode.EN_US),
                // name_localizations: Lang.getRefLocalizationMap('helpOptions.permissions'),
                value: HelpOption.PERMISSIONS,
            },
            {
                name: Lang.getRef('temp', 'helpOptions.faq', LangCode.EN_US),
                // name_localizations: Lang.getRefLocalizationMap('helpOptions.faq'),
                value: HelpOption.FAQ,
            },
        ],
    };
}
