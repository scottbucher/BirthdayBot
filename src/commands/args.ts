import {
    APIApplicationCommandBasicOption,
    APIApplicationCommandOptionChoice,
    ApplicationCommandOptionType,
} from 'discord.js';

import {
    HelpOption,
    InfoOption,
    LinkOption,
    ListCelebrationTypes,
    NextCelebrationTypes,
    ViewCelebrationTypes,
} from '../enums/index.js';
import {
    HelpOptionHelper,
    InfoOptionHelper,
    LinkOptionHelper,
    ListCelebrationTypeHelper,
    NextCelebrationTypeHelper,
    ViewCelebrationTypeHelper,
} from '../models/enum-helpers/index.js';
import { Language } from '../models/enum-helpers/language.js';
import { Lang } from '../services/index.js';

export class Args {
    public static readonly HELP_OPTION: APIApplicationCommandBasicOption = {
        name: Lang.getRef('commands', 'arguments.option', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('commands', 'arguments.option'),
        description: Lang.getRef('commands', 'argDescs.helpOption', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('commands', 'argDescs.helpOption'),
        type: ApplicationCommandOptionType.String,
        required: false,
        choices: Object.values(HelpOption).map(
            choice =>
                <APIApplicationCommandOptionChoice<string>>{
                    name: HelpOptionHelper.Data[choice].displayName(Language.Default),
                    name_localizations: HelpOptionHelper.Data[choice].localizationMap(),
                    value: choice,
                }
        ),
    };

    public static readonly VIEW_TYPE_OPTION: APIApplicationCommandBasicOption = {
        name: Lang.getRef('commands', 'arguments.type', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('commands', 'arguments.type'),
        description: Lang.getRef('commands', 'argDescs.viewType', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('commands', 'argDescs.viewType'),
        type: ApplicationCommandOptionType.String.valueOf(),
        required: false,
        choices: Object.values(ViewCelebrationTypes).map(
            choice =>
                <APIApplicationCommandOptionChoice<string>>{
                    name: ViewCelebrationTypeHelper.Data[choice].displayName(Language.Default),
                    name_localizations: ViewCelebrationTypeHelper.Data[choice].localizationMap(),
                    value: choice,
                }
        ),
    };

    public static readonly USER_OPTION: APIApplicationCommandBasicOption = {
        name: Lang.getRef('commands', 'arguments.user', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('commands', 'arguments.user'),
        description: Lang.getRef('commands', 'argDescs.viewUser', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('commands', 'argDescs.viewUser'),
        type: ApplicationCommandOptionType.User.valueOf(),
        required: false,
    };

    public static readonly INFO_OPTION: APIApplicationCommandBasicOption = {
        name: Lang.getRef('commands', 'arguments.option', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('commands', 'arguments.option'),
        description: Lang.getRef('commands', 'argDescs.infoOption', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('commands', 'argDescs.infoOption'),
        type: ApplicationCommandOptionType.String,
        required: true,
        choices: Object.values(InfoOption).map(
            choice =>
                <APIApplicationCommandOptionChoice<string>>{
                    name: InfoOptionHelper.Data[choice].displayName(Language.Default),
                    name_localizations: InfoOptionHelper.Data[choice].localizationMap(),
                    value: choice,
                }
        ),
    };

    public static readonly LINK_OPTION: APIApplicationCommandBasicOption = {
        name: Lang.getRef('commands', 'arguments.link', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('commands', 'arguments.link'),
        description: Lang.getRef('commands', 'argDescs.linkOption', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('commands', 'argDescs.linkOption'),
        type: ApplicationCommandOptionType.String,
        required: true,
        choices: Object.values(LinkOption).map(
            choice =>
                <APIApplicationCommandOptionChoice<string>>{
                    name: LinkOptionHelper.Data[choice].displayName(Language.Default),
                    name_localizations: LinkOptionHelper.Data[choice].localizationMap(),
                    value: choice,
                }
        ),
    };

    public static readonly LIST_TYPE_OPTION: APIApplicationCommandBasicOption = {
        name: Lang.getRef('commands', 'arguments.type', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('commands', 'arguments.type'),
        description: Lang.getRef('commands', 'argDescs.listType', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('commands', 'argDescs.listType'),
        type: ApplicationCommandOptionType.String.valueOf(),
        required: false,
        choices: Object.values(ListCelebrationTypes).map(
            choice =>
                <APIApplicationCommandOptionChoice<string>>{
                    name: ListCelebrationTypeHelper.Data[choice].displayName(Language.Default),
                    name_localizations: ListCelebrationTypeHelper.Data[choice].localizationMap(),
                    value: choice,
                }
        ),
    };

    public static readonly NEXT_CELEBRATION_TYPE_OPTION: APIApplicationCommandBasicOption = {
        name: Lang.getRef('commands', 'arguments.type', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('commands', 'arguments.type'),
        description: Lang.getRef('commands', 'argDescs.celebrationType', Language.Default),
        description_localizations: Lang.getRefLocalizationMap(
            'commands',
            'argDescs.celebrationType'
        ),
        type: ApplicationCommandOptionType.String.valueOf(),
        required: false,
        choices: Object.values(NextCelebrationTypes).map(
            choice =>
                <APIApplicationCommandOptionChoice<string>>{
                    name: NextCelebrationTypeHelper.Data[choice].displayName(Language.Default),
                    name_localizations: NextCelebrationTypeHelper.Data[choice].localizationMap(),
                    value: choice,
                }
        ),
    };

    public static readonly PAGE_OPTION: APIApplicationCommandBasicOption = {
        name: Lang.getRef('commands', 'arguments.page', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('commands', 'arguments.page'),
        description: Lang.getRef('commands', 'argDescs.page', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('commands', 'argDescs.page'),
        type: ApplicationCommandOptionType.Integer.valueOf(),
        min_value: 1,
        required: false,
    };

    public static readonly DATE_OPTION: APIApplicationCommandBasicOption = {
        name: Lang.getRef('commands', 'arguments.date', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('commands', 'arguments.date'),
        description: Lang.getRef('commands', 'argDescs.setDateOption', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('commands', 'argDescs.setDateOption'),
        type: ApplicationCommandOptionType.Integer.valueOf(),
        min_value: 1,
        required: false,
    };

    public static readonly TIME_ZONE_OPTION: APIApplicationCommandBasicOption = {
        name: Lang.getRef('commands', 'arguments.timeZone', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('commands', 'arguments.timeZone'),
        description: Lang.getRef('commands', 'argDescs.setTimeZoneOption', Language.Default),
        description_localizations: Lang.getRefLocalizationMap(
            'commands',
            'argDescs.setTimeZoneOption'
        ),
        type: ApplicationCommandOptionType.Integer.valueOf(),
        min_value: 1,
        required: false,
    };
}
