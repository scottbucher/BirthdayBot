import { APIApplicationCommandBasicOption, ApplicationCommandOptionType } from 'discord.js';

import { HelpOption } from '../enums/index.js';
import { Language } from '../models/enum-helpers/language.js';
import { Lang } from '../services/index.js';

export class Args {
    public static readonly HELP_OPTION: APIApplicationCommandBasicOption = {
        name: Lang.getRef('commands', 'arguments.option', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('commands', 'arguments.option'),
        description: Lang.getRef('commands', 'argDescs.helpOption', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('commands', 'argDescs.helpOption'),
        type: ApplicationCommandOptionType.String,
        choices: [
            {
                name: Lang.getRef('commands', 'helpChoiceDescs.general', Language.Default),
                name_localizations: Lang.getRefLocalizationMap(
                    'commands',
                    'helpChoiceDescs.general'
                ),
                value: HelpOption.GENERAL,
            },
            {
                name: Lang.getRef('commands', 'helpChoiceDescs.blacklist', Language.Default),
                name_localizations: Lang.getRefLocalizationMap(
                    'commands',
                    'helpChoiceDescs.blacklist'
                ),
                value: HelpOption.BLACKLIST,
            },
            {
                name: Lang.getRef('commands', 'helpChoiceDescs.config', Language.Default),
                name_localizations: Lang.getRefLocalizationMap(
                    'commands',
                    'helpChoiceDescs.config'
                ),
                value: HelpOption.CONFIG,
            },
            {
                name: Lang.getRef('commands', 'helpChoiceDescs.message', Language.Default),
                name_localizations: Lang.getRefLocalizationMap(
                    'commands',
                    'helpChoiceDescs.message'
                ),
                value: HelpOption.MESSAGE,
            },
            {
                name: Lang.getRef('commands', 'helpChoiceDescs.event', Language.Default),
                name_localizations: Lang.getRefLocalizationMap('commands', 'helpChoiceDescs.event'),
                value: HelpOption.TRUSTED_ROLE,
            },
            {
                name: Lang.getRef('commands', 'helpChoiceDescs.trustedRole', Language.Default),
                name_localizations: Lang.getRefLocalizationMap(
                    'commands',
                    'helpChoiceDescs.trustedRole'
                ),
                value: HelpOption.TRUSTED_ROLE,
            },
            {
                name: Lang.getRef('commands', 'helpChoiceDescs.mar', Language.Default),
                name_localizations: Lang.getRefLocalizationMap('commands', 'helpChoiceDescs.mar'),
                value: HelpOption.MEMBER_ANNIVERSARY_ROLE,
            },
            {
                name: Lang.getRef('commands', 'helpChoiceDescs.premium', Language.Default),
                name_localizations: Lang.getRefLocalizationMap(
                    'commands',
                    'helpChoiceDescs.premium'
                ),
                value: HelpOption.PREMIUM,
            },
            {
                name: Lang.getRef('commands', 'helpChoiceDescs.permissions', Language.Default),
                name_localizations: Lang.getRefLocalizationMap(
                    'commands',
                    'helpChoiceDescs.permissions'
                ),
                value: HelpOption.PERMISSIONS,
            },
        ],
    };
}
