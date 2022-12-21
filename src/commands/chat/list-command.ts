import {
    ButtonStyle,
    ChatInputCommandInteraction,
    ComponentType,
    EmbedBuilder,
    PermissionsString,
} from 'discord.js';
import { DateTime } from 'luxon';
import { createRequire } from 'node:module';

import { UserData } from '../../database/entities/user.js';
import {
    CelebrationType,
    DataValidation,
    EventDataType,
    ListCelebrationType,
} from '../../enums/index.js';
import { Language } from '../../models/enum-helpers/language.js';
import { EventData } from '../../models/internal-models.js';
import { Lang } from '../../services/lang.js';
import { InteractionUtils, ListUtils } from '../../utils/index.js';
import { Command, CommandDeferType } from '../command.js';

const require = createRequire(import.meta.url);
let Config = require('../../../config/config.json');

export class ListCommand implements Command {
    public names = [Lang.getRef('commands', 'chatCommands.list', Language.Default)];
    public deferType = CommandDeferType.HIDDEN;
    public requireDev = false;
    public requireClientPerms: PermissionsString[] = [];
    public requireSetup = false;
    public requireVote = false;
    public requireEventData: EventDataType[] = [];
    public dataValidation: DataValidation[] = [];

    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        let type =
            (intr.options.getString(
                Lang.getRef('commands', 'arguments.type', Language.Default)
            ) as ListCelebrationType) ?? CelebrationType.BIRTHDAY;
        let page =
            intr.options.getInteger(Lang.getRef('commands', 'arguments.page', Language.Default)) ??
            1;
        let guildData = data.guildData;

        let pageSize: number =
            type === CelebrationType.BIRTHDAY
                ? Config.experience.birthdayListSize
                : Config.experience.memberAnniversaryListSize;
        let embed: EmbedBuilder;

        let guildMembers = intr.guild.members.cache;

        // if (intr.guild.memberCount - guildMembers.size > 5) {
        //     guildMembers = await intr.guild.members.fetch();
        // }

        if (type === CelebrationType.BIRTHDAY) {
            // Birthday List
            let users = [...guildMembers.filter(member => !member.user.bot).keys()];

            // Use the comma separated list of users to get the user data from MikroORM
            let userDataResults = await data.em.find(UserData, { discordId: users });

            embed = await ListUtils.getBirthdayListFullEmbed(
                intr.guild,
                userDataResults,
                guildData,
                page,
                pageSize,
                data
            );
        } else {
            // Member Anniversary List
            let memberList = guildMembers.filter(member => !member.user.bot).map(member => member);

            let totalMembers = memberList.length;

            memberList = memberList.sort(
                (first, second) =>
                    0 -
                    (DateTime.fromJSDate(first.joinedAt).toFormat('LL-dd') >
                    DateTime.fromJSDate(second.joinedAt).toFormat('LL-dd')
                        ? -1
                        : 1)
            );

            let totalPages = Math.ceil(memberList.length / pageSize);

            if (page > totalPages) page = totalPages;

            let startMember: number;

            startMember = (page - 1) * pageSize;

            memberList = memberList.slice(startMember, startMember + pageSize);

            embed = await ListUtils.getMemberAnniversaryListFullEmbed(
                intr.guild,
                memberList,
                guildData,
                page,
                pageSize,
                totalPages,
                totalMembers,
                data
            );
        }

        await InteractionUtils.send(intr, {
            embeds: [embed],
            components: [
                {
                    type: ComponentType.ActionRow,
                    components: [
                        {
                            type: ComponentType.Button,
                            customId: type + '_list_previous_more',
                            emoji: Config.emotes.previousMore,
                            style: ButtonStyle.Primary,
                        },
                        {
                            type: ComponentType.Button,
                            customId: type + '_list_previous',
                            emoji: Config.emotes.previous,
                            style: ButtonStyle.Primary,
                        },
                        {
                            type: ComponentType.Button,
                            customId: type + '_list_refresh',
                            emoji: Config.emotes.refresh,
                            style: ButtonStyle.Primary,
                        },
                        {
                            type: ComponentType.Button,
                            customId: type + '_list_next',
                            emoji: Config.emotes.next,
                            style: ButtonStyle.Primary,
                        },
                        {
                            type: ComponentType.Button,
                            customId: type + '_list_next_more',
                            emoji: Config.emotes.nextMore,
                            style: ButtonStyle.Primary,
                        },
                    ],
                },
            ],
        });
    }
}
