import {
    ApplicationCommandData,
    CommandInteraction,
    Message,
    MessageReaction,
    PermissionString,
    User,
} from 'discord.js';
import {
    CollectOptions,
    CollectorUtils,
    ExpireFunction,
    MessageFilter,
} from 'discord.js-collector-utils';

import { Command } from './command';
import { EventData } from '../models/internal-models';
import { Lang } from '../services';
import { LangCode } from '../models/enums';
import { MessageUtils } from '../utils';
import { UserRepo } from '../services/database/repos';
import { channel } from 'diagnostics_channel';

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
    public requireClientPerms: PermissionString[] = [];
    public requireUserPerms: PermissionString[] = [];
    public requireSetup = false;
    public requireVote = false;
    public requirePremium = false;

    constructor(private userRepo: UserRepo) {}

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        let target = intr.user;
        let userData = await this.userRepo.getUser(target.id);
        let stopFilter: MessageFilter = (nextMsg: Message) => nextMsg.author.id === intr.user.id;
        let expireFunction: ExpireFunction = async () => {
            await MessageUtils.sendIntr(
                intr,
                Lang.getEmbed('validation', 'results.promptExpired', data.lang())
            );
        };

        if (!userData || !(userData.Birthday && userData.TimeZone)) {
            // Are they in the database?
            await MessageUtils.sendIntr(
                intr,
                Lang.getEmbed('validation', 'embed.birthdayNotSet', data.lang())
            );
            return;
        }

        let trueFalseOptions = [Config.emotes.confirm, Config.emotes.deny];

        let confirmationMessage = await MessageUtils.sendIntr(
            intr,
            Lang.getEmbed('prompts', 'embeds.birthdayConfirmPurge', LangCode.EN_US, {
                ICON: intr.user.displayAvatarURL(),
            })
        ); // Send confirmation and emotes
        for (let option of trueFalseOptions) {
            await MessageUtils.react(confirmationMessage, option);
        }

        let confirmation: string = await CollectorUtils.collectByReaction(
            confirmationMessage,
            // Collect Filter
            (msgReaction: MessageReaction, reactor: User) =>
                reactor.id === target.id && trueFalseOptions.includes(msgReaction.emoji.name),
            stopFilter,
            // Retrieve Result
            async (msgReaction: MessageReaction, reactor: User) => {
                return msgReaction.emoji.name;
            },
            expireFunction,
            COLLECT_OPTIONS
        );

        MessageUtils.delete(confirmationMessage);

        if (confirmation === undefined) return;

        if (confirmation === Config.emotes.confirm) {
            // Confirm
            await this.userRepo.addOrUpdateUser(target.id, null, null, userData.ChangesLeft); // Add or update user

            await MessageUtils.sendIntr(
                intr,
                Lang.getEmbed('results', 'embeds.purgeSuccessful', LangCode.EN_US)
            );
        } else if (confirmation === Config.emotes.deny) {
            // Cancel
            await MessageUtils.sendIntr(
                intr,
                Lang.getEmbed('results', 'embeds.actionCanceled', LangCode.EN_US)
            );
        }
    }
}
