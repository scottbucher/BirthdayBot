import {
    ApplicationCommandOptionType,
    RESTPostAPIChatInputApplicationCommandsJSONBody,
} from 'discord-api-types/v10';
import { CommandInteraction, MessageEmbed, PermissionString } from 'discord.js';
import moment from 'moment';
import { createRequire } from 'node:module';

import { UserDataResults } from '../models/database/user-data-results-models.js';
import { EventData } from '../models/index.js';
import { UserRepo } from '../services/database/repos/user-repo.js';
import { Lang } from '../services/index.js';
import { InteractionUtils, ListUtils } from '../utils/index.js';
import { Command, CommandDeferType } from './index.js';

const require = createRequire(import.meta.url);
let Config = require('../../config/config.json');
export class ListCommand implements Command {
    public metadata: RESTPostAPIChatInputApplicationCommandsJSONBody = {
        name: Lang.getCom('commands.list'),
        description: 'View the birthday list.',
        dm_permission: false,
        default_member_permissions: undefined,
        options: [
            {
                name: Lang.getCom('arguments.type'),
                description: 'What type of list you would like to view, defaults to birthday.',
                type: ApplicationCommandOptionType.String.valueOf(),
                required: false,
                choices: [
                    {
                        name: 'birthday',
                        value: 'birthday',
                    },
                    {
                        name: 'memberAnniversary',
                        value: 'member_anniversary',
                    },
                ],
            },
            {
                name: Lang.getCom('arguments.page'),
                description: 'An optional page number to jump to.',
                type: ApplicationCommandOptionType.Integer.valueOf(),
                required: false,
                min_value: 1,
            },
        ],
    };
    public deferType = CommandDeferType.PUBLIC;
    public requireDev = false;
    public requireClientPerms: PermissionString[] = [];
    public requireSetup = false;
    public requireVote = true;
    public requirePremium = false;

    constructor(public userRepo: UserRepo) {}

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        let guildData = data.guild;

        let type =
            intr.options.getString(Lang.getCom('arguments.type'))?.toLowerCase() ?? 'birthday';
        let page = intr.options.getInteger(Lang.getCom('arguments.page')) ?? 1;

        let date: moment.MomentInput;

        let pageSize: number =
            type === 'birthday'
                ? Config.experience.birthdayListSize
                : Config.experience.memberAnniversaryListSize;
        let embed: MessageEmbed;

        let guildMembers = intr.guild.members.cache;

        if (intr.guild.memberCount - guildMembers.size > 5) {
            guildMembers = await intr.guild.members.fetch();
        }

        if (type === 'birthday') {
            // Birthday List
            let users = [...guildMembers.filter(member => !member.user.bot).keys()];

            let userDataResults: UserDataResults;

            if (date) {
                let input = moment(date).format('MM-DD');
                userDataResults = await this.userRepo.getBirthdayListFullFromDate(
                    users,
                    pageSize,
                    input
                );
            } else {
                userDataResults = await this.userRepo.getBirthdayListFull(users, pageSize, page);
            }

            embed = await ListUtils.getBirthdayListFullEmbed(
                intr.guild,
                userDataResults,
                guildData,
                userDataResults.stats.Page,
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
                    (moment(first.joinedAt).format('MM-DD') >
                    moment(second.joinedAt).format('MM-DD')
                        ? -1
                        : 1)
            );

            let totalPages = Math.ceil(memberList.length / pageSize);

            if (page > totalPages) page = totalPages;

            let startMember: number;

            if (date) {
                startMember = memberList.indexOf(
                    memberList.find(
                        m => moment(m.joinedAt).format('MM') === moment(date).format('MM')
                    )
                );
            } else {
                startMember = (page - 1) * pageSize;
            }

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
                    type: 'ACTION_ROW',
                    components: [
                        {
                            type: 'BUTTON',
                            customId: type + '_list_previous_more',
                            emoji: Config.emotes.previousMore,
                            style: 'PRIMARY',
                        },
                        {
                            type: 'BUTTON',
                            customId: type + '_list_previous',
                            emoji: Config.emotes.previous,
                            style: 'PRIMARY',
                        },
                        {
                            type: 'BUTTON',
                            customId: type + '_list_refresh',
                            emoji: Config.emotes.refresh,
                            style: 'PRIMARY',
                        },
                        {
                            type: 'BUTTON',
                            customId: type + '_list_next',
                            emoji: Config.emotes.next,
                            style: 'PRIMARY',
                        },
                        {
                            type: 'BUTTON',
                            customId: type + '_list_next_more',
                            emoji: Config.emotes.nextMore,
                            style: 'PRIMARY',
                        },
                    ],
                },
            ],
        });
    }
}
