import { ButtonInteraction, Message } from 'discord.js';
import moment from 'moment';
import { createRequire } from 'node:module';

import { EventData } from '../models/internal-models.js';
import { ButtonUtils, InteractionUtils, ListUtils, RegexUtils } from '../utils/index.js';
import { Button, ButtonDeferType } from './index.js';

const require = createRequire(import.meta.url);
let Config = require('../../config/config.json');

export class MemberAnniversaryListButton implements Button {
    public ids = [
        'member_anniversary_list_previous',
        'member_anniversary_list_next',
        'member_anniversary_list_previous_more',
        'member_anniversary_list_next_more',
        'member_anniversary_list_refresh',
    ];
    public deferType = ButtonDeferType.UPDATE;
    public requireGuild = true;

    public async execute(intr: ButtonInteraction, msg: Message, data: EventData): Promise<void> {
        let embed = msg.embeds[0];

        let pageNum = RegexUtils.pageNumber(embed.title);
        if (pageNum === undefined) {
            return;
        }

        let newPageNum = ButtonUtils.getNewPageNum(
            pageNum,
            intr.customId.replace(/^member_anniversary_list_/, '')
        );

        if (newPageNum === undefined) return;
        if (newPageNum <= 0) newPageNum = 1;

        let date: moment.MomentInput;

        let pageSize = Config.experience.memberAnniversaryListSize as number;

        let guildMembers = intr.guild.members.cache;
        // Member Anniversary List
        let memberList = guildMembers.filter(member => !member.user.bot).map(member => member);

        let totalMembers = memberList.length;

        memberList = memberList.sort(
            (first, second) =>
                0 -
                (moment(first.joinedAt).format('MM-DD') > moment(second.joinedAt).format('MM-DD')
                    ? -1
                    : 1)
        );

        let totalPages = Math.ceil(memberList.length / pageSize);

        if (newPageNum > totalPages) newPageNum = totalPages;

        let startMember: number;

        if (date) {
            startMember = memberList.indexOf(
                memberList.find(m => moment(m.joinedAt).format('MM') === moment(date).format('MM'))
            );
        } else {
            startMember = (newPageNum - 1) * pageSize;
        }

        memberList = memberList.slice(startMember, startMember + pageSize);

        let newEmbed = await ListUtils.getMemberAnniversaryListFullEmbed(
            intr.guild,
            memberList,
            data.guild,
            newPageNum,
            pageSize,
            totalPages,
            totalMembers,
            data
        );

        await InteractionUtils.editReply(intr, newEmbed);
        return;
    }
}
