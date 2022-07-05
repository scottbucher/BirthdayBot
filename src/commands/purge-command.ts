import { RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { CommandInteraction, PermissionString } from 'discord.js';

import { EventData } from '../models/index.js';
import { UserRepo } from '../services/database/repos/index.js';
import { Lang } from '../services/index.js';
import { CollectorUtils } from '../utils/collector-utils.js';
import { InteractionUtils } from '../utils/index.js';
import { Command, CommandDeferType } from './index.js';

export class PurgeCommand implements Command {
    public metadata: RESTPostAPIChatInputApplicationCommandsJSONBody = {
        name: Lang.getCom('commands.purge'),
        description: 'Remove your information from the database.',
        dm_permission: true,
        default_member_permissions: undefined,
    };
    public deferType = CommandDeferType.PUBLIC;
    public requireDev = false;
    public requireClientPerms: PermissionString[] = [];
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
                Lang.getErrorEmbed('validation', 'errorEmbeds.birthdayNotSet', data.lang(), {
                    USER: target.toString(),
                })
            );
            return;
        }

        let result = await CollectorUtils.getBooleanFromButton(
            intr,
            data,
            Lang.getEmbed('prompts', 'embeds.birthdayConfirmPurge', data.lang(), {
                ICON: intr.user.displayAvatarURL(),
            })
        );

        if (result === undefined) return;

        if (result.value) {
            // Confirm
            await this.userRepo.addOrUpdateUser(target.id, null, null, userData.ChangesLeft); // Add or update user

            await InteractionUtils.send(
                result.intr,
                Lang.getEmbed('results', 'success.purgeSuccessful', data.lang())
            );
        } else {
            // Cancel
            await InteractionUtils.send(
                result.intr,
                Lang.getEmbed('results', 'fail.actionCanceled', data.lang())
            );
        }
    }
}
