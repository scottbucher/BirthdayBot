import { ApplicationCommandData, CommandInteraction, Message, PermissionString } from 'discord.js';
import { CollectOptions, MessageFilter } from 'discord.js-collector-utils';

import { EventData } from '../models/internal-models';
import { Lang } from '../services';
import { UserRepo } from '../services/database/repos';
import { MessageUtils } from '../utils';
import { CollectorUtils } from '../utils/collector-utils';
import { Command, CommandDeferType } from './command';

let Config = require('../../config/config.json');

const COLLECT_OPTIONS: CollectOptions = {
    time: Config.experience.promptExpireTime * 1000,
    reset: true,
};
export class PurgeCommand implements Command {
    public metadata: ApplicationCommandData = {
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
        let stopFilter: MessageFilter = (nextMsg: Message) => nextMsg.author.id === intr.user.id;

        if (!userData || !(userData.Birthday && userData.TimeZone)) {
            // Are they in the database?
            await MessageUtils.sendIntr(
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

            await MessageUtils.sendIntr(
                intr,
                Lang.getEmbed('results', 'success.purgeSuccessful', data.lang())
            );
        } else {
            // Cancel
            await MessageUtils.sendIntr(
                intr,
                Lang.getEmbed('results', 'fail.actionCanceled', data.lang())
            );
        }
    }
}
