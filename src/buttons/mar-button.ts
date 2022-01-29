import { ButtonInteraction, Message } from 'discord.js';
import { createRequire } from 'node:module';

import { EventData } from '../models/internal-models.js';
import { MemberAnniversaryRoleRepo } from '../services/database/repos/index.js';
import { ButtonUtils, InteractionUtils, ListUtils, RegexUtils } from '../utils/index.js';
import { Button, ButtonDeferType } from './index.js';

const require = createRequire(import.meta.url);
let Config = require('../../config/config.json');

export class MarButton implements Button {
    public ids = ['mar_previous', 'mar_next', 'mar_previous_more', 'mar_next_more', 'mar_refresh'];
    public deferType = ButtonDeferType.NONE;
    public requireGuild = true;

    constructor(private marRepo: MemberAnniversaryRoleRepo) {}

    public async execute(intr: ButtonInteraction, msg: Message, data: EventData): Promise<void> {
        let embed = msg.embeds[0];

        let pageNum = RegexUtils.pageNumber(embed.title);
        if (pageNum === undefined) {
            return;
        }

        let newPageNum = ButtonUtils.getNewPageNum(pageNum, intr.customId.replace(/^mar_/, ''));
        if (newPageNum === undefined) {
            return;
        }

        let marData = await this.marRepo.getMemberAnniversaryRoleList(
            intr.guild.id,
            Config.experience.memberAnniversaryListSize,
            newPageNum
        );

        let newEmbed = await ListUtils.getMemberAnniversaryRoleListEmbed(
            intr.guild,
            marData,
            marData.stats.Page,
            Config.experience.memberAnniversaryListSize,
            data
        );

        await InteractionUtils.update(intr, newEmbed);
        return;
    }
}
