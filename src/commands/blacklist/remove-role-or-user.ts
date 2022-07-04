import { RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { CommandInteraction, GuildMember, PermissionString, Role, User } from 'discord.js';

import { EventData } from '../../models/index.js';
import { BlacklistRepo } from '../../services/database/repos/index.js';
import { Lang } from '../../services/index.js';
import { InteractionUtils } from '../../utils/index.js';
import { Command } from '../index.js';

export class BlacklistRemoveRoleOrUserSubCommand implements Command {
    constructor(public blacklistRepo: BlacklistRepo) {}
    public metadata: RESTPostAPIChatInputApplicationCommandsJSONBody = {
        name: Lang.getCom('subCommands.roleOrUser'),
        description: undefined,
    };

    public deferType = undefined;
    public requireDev = false;
    public requireClientPerms: PermissionString[] = [];
    public requireSetup = true;
    public requireVote = false;
    public requirePremium = false;

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        let mentionable = intr.options.getMentionable(Lang.getCom('arguments.roleOrUser'));

        //TODO: find a substitute or better way to handle this
        if (
            !(mentionable instanceof User) &&
            !(mentionable instanceof GuildMember) &&
            !(mentionable instanceof Role)
        ) {
            await InteractionUtils.send(
                intr,
                Lang.getErrorEmbed(
                    'validation',
                    'errorEmbeds.rawAPIInteractionDataReceived',
                    data.lang()
                )
            );
            return;
        }

        let blacklistData = await this.blacklistRepo.getBlacklist(intr.guild.id);

        if (!blacklistData.blacklist.map(b => b.DiscordId).includes(mentionable.id)) {
            await InteractionUtils.send(
                intr,
                Lang.getErrorEmbed('validation', 'errorEmbeds.notInBlacklist', data.lang(), {
                    TYPE: Lang.getRef(
                        'info',
                        `types.${mentionable instanceof Role ? 'role' : 'user'}`,
                        data.lang()
                    ),
                })
            );
            return;
        }

        await this.blacklistRepo.removeBlacklist(intr.guild.id, mentionable.id);

        await InteractionUtils.send(
            intr,
            Lang.getSuccessEmbed('results', 'successEmbeds.blacklistRemove', data.lang(), {
                TARGET: mentionable.toString(),
            })
        );
    }
}
