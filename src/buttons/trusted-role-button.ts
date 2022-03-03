import { ButtonInteraction, Message } from 'discord.js';
import { createRequire } from 'node:module';

import { EventData } from '../models/internal-models.js';
import { TrustedRoleRepo } from '../services/database/repos/index.js';
import { ButtonUtils, InteractionUtils, ListUtils, RegexUtils } from '../utils/index.js';
import { Button, ButtonDeferType } from './index.js';

const require = createRequire(import.meta.url);
let Config = require('../../config/config.json');

export class TrustedRoleButton implements Button {
    public ids = [
        'trusted_previous',
        'trusted_next',
        'trusted_previous_more',
        'trusted_next_more',
        'trusted_refresh',
    ];
    public deferType = ButtonDeferType.UPDATE;
    public requireGuild = true;

    constructor(private trustedRoleRepo: TrustedRoleRepo) {}

    public async execute(intr: ButtonInteraction, msg: Message, data: EventData): Promise<void> {
        let embed = msg.embeds[0];

        let pageNum = RegexUtils.pageNumber(embed.title);
        if (pageNum === undefined) {
            return;
        }

        let newPageNum = ButtonUtils.getNewPageNum(pageNum, intr.customId.replace(/^trusted_/, ''));
        if (newPageNum === undefined) return;
        if (newPageNum <= 0) newPageNum = 1;

        let trustedRoleData = await this.trustedRoleRepo.getTrustedRoleList(
            intr.guild.id,
            Config.experience.trustedRoleListSize,
            newPageNum
        );

        let newEmbed = await ListUtils.getTrustedRoleListEmbed(
            intr.guild,
            trustedRoleData,
            trustedRoleData.stats.Page,
            Config.experience.trustedRoleListSize,
            data
        );

        await InteractionUtils.editReply(intr, newEmbed);
        return;
    }
}
