import {
    ApplicationCommandData,
    CommandInteraction,
    Message,
    MessageReaction,
    PermissionString,
    User,
} from 'discord.js';
import { CollectOptions, ExpireFunction, MessageFilter } from 'discord.js-collector-utils';

import { CollectorUtils } from '../utils/collector-utils';
import { Command } from './command';
import { EventData } from '../models/internal-models';
import { Lang } from '../services';
import { MessageUtils } from '../utils';
import { UserRepo } from '../services/database/repos';

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
                Lang.getEmbed('validation', 'embeds.birthdayNotSet', data.lang())
            );
            return;
        }

        let collect = CollectorUtils.createReactCollect(intr.user, async () => {
            await MessageUtils.sendIntr(
                intr,
                Lang.getEmbed('validation', 'embeds.promptExpired', data.lang())
            );
        });

        let trueFalseOptions = [Config.emotes.confirm, Config.emotes.deny];

        let confirmationMessage = await MessageUtils.sendIntr(
            intr,
            Lang.getEmbed('prompts', 'embeds.birthdayConfirmPurge', data.lang(), {
                ICON: intr.user.displayAvatarURL(),
            })
        ); // Send confirmation and emotes
        for (let option of trueFalseOptions) {
            await MessageUtils.react(confirmationMessage, option);
        }

        let confirmation: string = await collect(
            confirmationMessage,
            async (msgReaction: MessageReaction, reactor: User) => {
                if (!trueFalseOptions.includes(msgReaction.emoji.name)) return;
                return msgReaction.emoji.name;
            }
        );

        MessageUtils.delete(confirmationMessage);

        if (confirmation === undefined) return;

        if (confirmation === Config.emotes.confirm) {
            // Confirm
            await this.userRepo.addOrUpdateUser(target.id, null, null, userData.ChangesLeft); // Add or update user

            await MessageUtils.sendIntr(
                intr,
                Lang.getEmbed('results', 'embeds.purgeSuccessful', data.lang())
            );
        } else if (confirmation === Config.emotes.deny) {
            // Cancel
            await MessageUtils.sendIntr(
                intr,
                Lang.getEmbed('results', 'embeds.actionCanceled', data.lang())
            );
        }
    }
}
