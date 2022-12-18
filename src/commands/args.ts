import { APIApplicationCommandBasicOption, ApplicationCommandOptionType } from 'discord.js';

import { CelebrationType, HelpOption, InfoOption, LinkOption } from '../enums/index.js';
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

    public static readonly VIEW_TYPE_OPTION: APIApplicationCommandBasicOption = {
        name: Lang.getRef('commands', 'arguments.type', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('commands', 'arguments.type'),
        description: Lang.getRef('commands', 'argDescs.viewType', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('commands', 'argDescs.viewType'),
        type: ApplicationCommandOptionType.String.valueOf(),
        choices: [
            {
                name: Lang.getRef('commands', 'celebrationTypeChoices.birthday', Language.Default),
                name_localizations: Lang.getRefLocalizationMap(
                    'commands',
                    'celebrationTypeChoices.birthday'
                ),
                value: CelebrationType.BIRTHDAY,
            },
            {
                name: Lang.getRef(
                    'commands',
                    'celebrationTypeChoices.memberAnniversary',
                    Language.Default
                ),
                name_localizations: Lang.getRefLocalizationMap(
                    'commands',
                    'celebrationTypeChoices.memberAnniversary'
                ),
                value: CelebrationType.MEMBER_ANNIVERSARY,
            },
        ],
    };

    public static readonly VIEW_USER_OPTION: APIApplicationCommandBasicOption = {
        name: Lang.getRef('commands', 'arguments.user', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('commands', 'arguments.user'),
        description: Lang.getRef('commands', 'argDescs.viewUser', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('commands', 'argDescs.viewUser'),
        type: ApplicationCommandOptionType.User.valueOf(),
    };

    public static readonly INFO_OPTION: APIApplicationCommandBasicOption = {
        name: Lang.getRef('commands', 'arguments.option', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('commands', 'arguments.option'),
        description: Lang.getRef('commands', 'argDescs.infoOption', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('commands', 'argDescs.infoOption'),
        type: ApplicationCommandOptionType.String,
        choices: [
            {
                name: Lang.getRef('commands', 'infoChoices.about', Language.Default),
                name_localizations: Lang.getRefLocalizationMap('commands', 'infoChoices.about'),
                value: InfoOption.ABOUT,
            },
            {
                name: Lang.getRef('commands', 'infoChoices.dev', Language.Default),
                name_localizations: Lang.getRefLocalizationMap('commands', 'infoChoices.dev'),
                value: InfoOption.DEV,
            },
            // {
            //     name: Lang.getRef('commands', 'infoChoices.translate', Language.Default),
            //     name_localizations: Lang.getRefLocalizationMap('commands', 'infoChoices.translate'),
            //     value: InfoOption.TRANSLATE,
            // },
        ],
    };

    public static readonly LINK_OPTION: APIApplicationCommandBasicOption = {
        name: Lang.getRef('commands', 'arguments.link', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('commands', 'arguments.link'),
        description: Lang.getRef('commands', 'argDescs.linkOption', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('commands', 'argDescs.linkOption'),
        type: ApplicationCommandOptionType.String,
        choices: [
            {
                name: Lang.getRef('commands', 'linkChoices.docs', Language.Default),
                name_localizations: Lang.getRefLocalizationMap('commands', 'linkChoices.docs'),
                value: LinkOption.DOCS,
            },
            {
                name: Lang.getRef('commands', 'linkChoices.faq', Language.Default),
                name_localizations: Lang.getRefLocalizationMap('commands', 'linkChoices.faq'),
                value: LinkOption.FAQ,
            },
            {
                name: Lang.getRef('commands', 'linkChoices.donate', Language.Default),
                name_localizations: Lang.getRefLocalizationMap('commands', 'linkChoices.donate'),
                value: LinkOption.DONATE,
            },
            {
                name: Lang.getRef('commands', 'linkChoices.invite', Language.Default),
                name_localizations: Lang.getRefLocalizationMap('commands', 'linkChoices.invite'),
                value: LinkOption.INVITE,
            },
            {
                name: Lang.getRef('commands', 'linkChoices.support', Language.Default),
                name_localizations: Lang.getRefLocalizationMap('commands', 'linkChoices.support'),
                value: LinkOption.SUPPORT,
            },
            {
                name: Lang.getRef('commands', 'linkChoices.vote', Language.Default),
                name_localizations: Lang.getRefLocalizationMap('commands', 'linkChoices.vote'),
                value: LinkOption.VOTE,
            },
            {
                name: Lang.getRef('commands', 'linkChoices.map', Language.Default),
                name_localizations: Lang.getRefLocalizationMap('commands', 'linkChoices.map'),
                value: LinkOption.MAP,
            },
        ],
    };

    public static readonly LIST_TYPE_OPTION: APIApplicationCommandBasicOption = {
        name: Lang.getRef('commands', 'arguments.type', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('commands', 'arguments.type'),
        description: Lang.getRef('commands', 'argDescs.listType', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('commands', 'argDescs.listType'),
        type: ApplicationCommandOptionType.String.valueOf(),
        choices: [
            {
                name: Lang.getRef('commands', 'celebrationTypeChoices.birthday', Language.Default),
                name_localizations: Lang.getRefLocalizationMap(
                    'commands',
                    'celebrationTypeChoices.birthday'
                ),
                value: CelebrationType.BIRTHDAY,
            },
            {
                name: Lang.getRef(
                    'commands',
                    'celebrationTypeChoices.memberAnniversary',
                    Language.Default
                ),
                name_localizations: Lang.getRefLocalizationMap(
                    'commands',
                    'celebrationTypeChoices.memberAnniversary'
                ),
                value: CelebrationType.MEMBER_ANNIVERSARY,
            },
        ],
    };

    public static readonly PAGE_OPTION: APIApplicationCommandBasicOption = {
        name: Lang.getRef('commands', 'arguments.page', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('commands', 'arguments.page'),
        description: Lang.getRef('commands', 'argDescs.page', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('commands', 'argDescs.page'),
        type: ApplicationCommandOptionType.Integer.valueOf(),
        min_value: 1,
    };
}
