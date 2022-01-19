import { ApplicationCommandData, CommandInteraction, PermissionString } from 'discord.js';
import { createRequire } from 'node:module';

import { EventData } from '../../models/index.js';
import { TrustedRoleRepo } from '../../services/database/repos/index.js';
import { Lang } from '../../services/index.js';
import { ListUtils, MessageUtils } from '../../utils/index.js';
import { Command } from '../index.js';

const require = createRequire(import.meta.url);
let Config = require('../../../config/config.json');

export class TrustedRoleListSubCommand implements Command {
    constructor(public trustedRoleRepo: TrustedRoleRepo) {}
    public metadata: ApplicationCommandData = {
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
        let hasPremium = data.subscription ? data.subscription.service : false;

        let pageSize = Config.experience.trustedRoleListSize;

        let trustedRoleResults = await this.trustedRoleRepo.getTrustedRoleList(
            intr.guild.id,
            pageSize,
            page
        );

        if (page > trustedRoleResults.stats.TotalPages) page = trustedRoleResults.stats.TotalPages;

        let embed = await ListUtils.getTrustedRoleListEmbed(
            intr.guild,
            trustedRoleResults,
            page,
            pageSize,
            hasPremium,
            data
        );

        await MessageUtils.sendIntr(intr, {
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
