import { ChatInputCommandInteraction, EmbedBuilder, PermissionsString } from 'discord.js';

import { DataValidation, EventDataType, LinkOption } from '../../enums/index.js';
import { Language } from '../../models/enum-helpers/language.js';
import { EventData } from '../../models/internal-models.js';
import { Lang } from '../../services/lang.js';
import { InteractionUtils } from '../../utils/index.js';
import { Command, CommandDeferType } from '../command.js';

export class LinkCommand implements Command {
    public names = [Lang.getRef('commands', 'chatCommands.link', Language.Default)];
    public deferType = CommandDeferType.HIDDEN;
    public requireDev = false;
    public requireClientPerms: PermissionsString[] = [];
    public requireEventData: EventDataType[] = [];
    public dataValidation: DataValidation[] = [];

    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        let link = intr.options.getString(
            Lang.getRef('commands', 'arguments.link', Language.Default)
        ) as LinkOption;

        let embed: EmbedBuilder;
        switch (link) {
            case LinkOption.DOCS: {
                embed = Lang.getEmbed('info', 'embeds.docs', data.lang, {
                    BOT: intr.client.user.toString(),
                });
                break;
            }
            case LinkOption.FAQ: {
                embed = Lang.getEmbed('info', 'embeds.faq', data.lang, {
                    BOT: intr.client.user.toString(),
                });
                break;
            }
            case LinkOption.DONATE: {
                embed = Lang.getEmbed('info', 'embeds.donate', data.lang, {
                    BOT: intr.client.user.toString(),
                });
                break;
            }
            case LinkOption.INVITE: {
                embed = Lang.getEmbed('info', 'embeds.invite', data.lang, {
                    BOT: intr.client.user.toString(),
                });
                break;
            }
            case LinkOption.SUPPORT: {
                embed = Lang.getEmbed('info', 'embeds.support', data.lang, {
                    BOT: intr.client.user.toString(),
                });
                break;
            }
            case LinkOption.VOTE: {
                embed = Lang.getEmbed('info', 'embeds.vote', data.lang, {
                    BOT: intr.client.user.toString(),
                });
                break;
            }
            case LinkOption.MAP: {
                embed = Lang.getEmbed('info', 'embeds.map', data.lang, {
                    BOT: intr.client.user.toString(),
                });
                break;
            }
            default: {
                return;
            }
        }

        await InteractionUtils.send(intr, embed);
    }
}
