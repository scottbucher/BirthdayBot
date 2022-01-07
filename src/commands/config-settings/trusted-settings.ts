import { CommandInteraction, Message, MessageReaction, User } from 'discord.js';
import { EventData } from '../../models';
import { Lang } from '../../services';
import { GuildRepo } from '../../services/database/repos';
import { FormatUtils, MessageUtils } from '../../utils';
import { CollectorUtils } from '../../utils/collector-utils';

let Config = require('../../../config/config.json');

const trueFalseOptions = [Config.emotes.confirm, Config.emotes.deny];
export class TrustedSettingsCommand {
    constructor(public guildRepo: GuildRepo) {}

    public async execute(intr: CommandInteraction, data: EventData, reset: boolean): Promise<void> {
        let setting = intr.options.getString(Lang.getCom('arguments.setting'));
        let choice: number;

        // Get the prompt embed based on the setting, all are a true or false
        let promptEmbed = Lang.getEmbed(
            'prompts',
            `config.${
                setting === 'TRUSTED_PREVENTS_MESSAGE'
                    ? 'trustedPreventsMessage'
                    : setting === 'TRUSTED_PREVENTS_ROLE'
                    ? 'trustedPreventsRole'
                    : 'trustedRequireAll'
            }`,
            data.lang()
        );

        if (!reset) {
            // prompt them for a setting
            let collectReact = CollectorUtils.createReactCollect(intr.user, async () => {
                await MessageUtils.sendIntr(
                    intr,
                    Lang.getEmbed('results', 'fail.promptExpired', data.lang())
                );
            });
            let confirmationMessage = await MessageUtils.sendIntr(intr, promptEmbed);
            // Send confirmation and emotes
            for (let option of trueFalseOptions) {
                await MessageUtils.react(confirmationMessage, option);
            }

            choice = await collectReact(
                confirmationMessage,
                async (msgReaction: MessageReaction, reactor: User) => {
                    if (!trueFalseOptions.includes(msgReaction.emoji.name)) return;
                    return msgReaction.emoji.name === Config.emotes.confirm ? 1 : 0;
                }
            );

            if (choice === undefined) return;
        } else choice = 1;

        let successEmbed: string;

        switch (setting) {
            case 'TRUSTED_PREVENTS_MESSAGE':
                successEmbed = choice
                    ? 'successEmbeds.trustedPreventsRoleYes'
                    : 'successEmbeds.trustedPreventsRoleNo';
                await this.guildRepo.updateTrustedPreventsMessage(intr.guild.id, choice);
                break;
            case 'TRUSTED_PREVENTS_ROLE':
                successEmbed = choice
                    ? 'successEmbeds.trustedPreventsMessageYes'
                    : 'successEmbeds.trustedPreventsMessageNo';
                await this.guildRepo.updateTrustedPreventsRole(intr.guild.id, choice);
                break;
            case 'REQUIRE_ALL_TRUSTED_ROLES':
                successEmbed = choice
                    ? 'successEmbeds.requireAllTrustedYes'
                    : 'successEmbeds.requireAllTrustedNo';
                await this.guildRepo.updateRequireAllTrustedRoles(intr.guild.id, choice);
                break;
        }

        await MessageUtils.sendIntr(
            intr,
            Lang.getSuccessEmbed('results', successEmbed, data.lang())
        );
    }
}
