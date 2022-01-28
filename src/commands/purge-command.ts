import { ChatInputApplicationCommandData, CommandInteraction, PermissionString } from 'discord.js';

import { EventData } from '../models/index.js';
import { UserRepo } from '../services/database/repos/index.js';
import { Lang } from '../services/index.js';
import { CollectorUtils } from '../utils/collector-utils.js';
import { InteractionUtils } from '../utils/index.js';
import { Command, CommandDeferType } from './index.js';

export class PurgeCommand implements Command {
    public metadata: ChatInputApplicationCommandData = {
        name: Lang.getCom('commands.purge'),
        description: 'Remove your information from the database.',
    };
    public deferType = CommandDeferType.PUBLIC;
    public requireDev = false;
    public requireGuild = false;
    public requireClientPerms: PermissionString[] = [
        'ADD_REACTIONS',
        'VIEW_CHANNEL',
        'MANAGE_MESSAGES',
        'READ_MESSAGE_HISTORY',
    ];
    public requireUserPerms: PermissionString[] = [];
    public requireSetup = false;
    public requireVote = false;
    public requirePremium = false;

    constructor(private userRepo: UserRepo) {}

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        let target = intr.user;
        let userData = await this.userRepo.getUser(target.id);

        if (!userData || !(userData.Birthday && userData.TimeZone)) {
            // Are they in the database?
            await InteractionUtils.send(
                intr,
                Lang.getErrorEmbed('validation', 'errorEmbeds.birthdayNotSet', data.lang())
            );
            return;
        }

        let confirmation = await CollectorUtils.getBooleanFromReact(
            intr,
            data,
            Lang.getEmbed('prompts', 'embeds.birthdayConfirmPurge', data.lang(), {
                ICON: intr.user.displayAvatarURL(),
            })
        );

        if (confirmation === undefined) return;

        if (confirmation) {
            // Confirm
            await this.userRepo.addOrUpdateUser(target.id, null, null, userData.ChangesLeft); // Add or update user

            await InteractionUtils.send(
                intr,
                Lang.getEmbed('results', 'success.purgeSuccessful', data.lang())
            );
        } else {
            // Cancel
            await InteractionUtils.send(
                intr,
                Lang.getEmbed('results', 'fail.actionCanceled', data.lang())
            );
        }
    }
}
