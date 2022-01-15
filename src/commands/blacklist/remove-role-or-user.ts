import {
    ApplicationCommandData,
    CommandInteraction,
    GuildMember,
    PermissionString,
    Role,
    User,
} from 'discord.js';

import { Command } from '..';
import { EventData } from '../../models';
import { Lang } from '../../services';
import { BlacklistRepo } from '../../services/database/repos';
import { MessageUtils } from '../../utils';

export class BlacklistRemoveRoleOrUserSubCommand implements Command {
    constructor(public blacklistRepo: BlacklistRepo) {}
    public metadata: ApplicationCommandData = {
        name: Lang.getCom('subCommands.roleOrUser'),
        description: undefined,
    };

    public requireDev = false;
    public requireGuild = true;
    public requireClientPerms: PermissionString[] = [];
    public requireUserPerms: PermissionString[] = [];
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
            await MessageUtils.sendIntr(
                intr,
                Lang.getErrorEmbed(
                    'validation',
                    'errorEmbeds.rawAPIInteractionDataReceived',
                    data.lang()
                )
            );
            return;
        }

        let blaklistData = await this.blacklistRepo.getBlacklist(intr.guild.id);

        if (!blaklistData.blacklist.map(b => b.DiscordId).includes(mentionable.id)) {
            await MessageUtils.sendIntr(
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

        await MessageUtils.sendIntr(
            intr,
            Lang.getSuccessEmbed('results', 'successEmbeds.blacklistRemove', data.lang(), {
                TARGET: mentionable.toString(),
            })
        );
    }
}
