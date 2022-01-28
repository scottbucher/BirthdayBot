import { ChatInputApplicationCommandData, CommandInteraction, PermissionString } from 'discord.js';
import { createRequire } from 'node:module';

import { EventData } from '../../models/index.js';
import { MemberAnniversaryRoleRepo } from '../../services/database/repos/index.js';
import { Lang } from '../../services/index.js';
import { InteractionUtils, ListUtils } from '../../utils/index.js';
import { Command } from '../index.js';

const require = createRequire(import.meta.url);
let Config = require('../../../config/config.json');

export class MarListSubCommand implements Command {
    constructor(public memberAnniversaryRoleRepo: MemberAnniversaryRoleRepo) {}
    public metadata: ChatInputApplicationCommandData = {
        name: Lang.getCom('subCommands.list'),
        description: undefined,
    };

    public deferType = undefined;
    public requireDev = false;
    public requireGuild = true;
    public requireClientPerms: PermissionString[] = [];
    public requireUserPerms: PermissionString[] = [];
    public requireSetup = true;
    public requireVote = false;
    public requirePremium = false;

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        let page = intr.options.getInteger(Lang.getCom('arguments.page')) ?? 1;
        let hasPremium =
            !Config.payments.enabled || (data.subscription && data.subscription.service);

        let pageSize = Config.experience.memberAnniversaryRoleListSize;

        let marResults = await this.memberAnniversaryRoleRepo.getMemberAnniversaryRoleList(
            intr.guild.id,
            pageSize,
            page
        );

        if (page > marResults.stats.TotalPages) page = marResults.stats.TotalPages;

        let embed = await ListUtils.getMemberAnniversaryRoleListEmbed(
            intr.guild,
            marResults,
            page,
            pageSize,
            hasPremium,
            data
        );

        await InteractionUtils.send(intr, {
            embeds: [embed],
            components: [
                {
                    type: 'ACTION_ROW',
                    components: [
                        {
                            type: 'BUTTON',
                            customId: 'queue_previous_more',
                            emoji: Config.emotes.previousMore,
                            style: 'PRIMARY',
                        },
                        {
                            type: 'BUTTON',
                            customId: 'queue_previous',
                            emoji: Config.emotes.previous,
                            style: 'PRIMARY',
                        },
                        {
                            type: 'BUTTON',
                            customId: 'queue_refresh',
                            emoji: Config.emotes.refresh,
                            style: 'PRIMARY',
                        },
                        {
                            type: 'BUTTON',
                            customId: 'queue_next',
                            emoji: Config.emotes.next,
                            style: 'PRIMARY',
                        },
                        {
                            type: 'BUTTON',
                            customId: 'queue_next_more',
                            emoji: Config.emotes.nextMore,
                            style: 'PRIMARY',
                        },
                    ],
                },
            ],
        });
    }
}
