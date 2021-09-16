import { GuildUtils, MessageUtils } from '../../utils';
import { Message, Role, TextChannel } from 'discord.js';

import { BlacklistRepo } from '../../services/database/repos';
import { Lang } from '../../services';
import { LangCode } from '../../models/enums';

export class BlacklistRemoveSubCommand {
    constructor(private blacklistRepo: BlacklistRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel): Promise<void> {
        if (args.length === 3) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.noUserOrRoleSpecified', LangCode.EN_US)
            );
            return;
        }

        // Get who they are mentioning
        let target =
            msg.mentions.members.first()?.user || GuildUtils.findMember(msg.guild, args[3])?.user;

        // Get the role they are mentioning
        let role: Role = msg.mentions.roles.first();

        let id: string;

        if (!target) {
            if (!role) {
                role = msg.guild.roles.cache.find(
                    role =>
                        role.name.toLowerCase().includes(args[3].toLowerCase()) ||
                        role.id === args[3].toLowerCase()
                );
            }

            if (role?.id === msg.guild.id || args[3].toLowerCase() === 'everyone') {
                MessageUtils.send(channel, Lang.getEmbed('validation.invalidRole', LangCode.EN_US));
                return;
            }
        } else {
            if (target.bot) {
                await MessageUtils.send(
                    channel,
                    Lang.getEmbed('validation.cantBlacklistBot', LangCode.EN_US)
                );
                return;
            }
        }

        id = target ? target.id : role ? role.id : args[3];

        let blacklist = await this.blacklistRepo.getBlacklist(msg.guild.id);

        if (!blacklist.blacklist.map(entry => entry.DiscordId).includes(id)) {
            // If we have a user or role use the correct type, otherwise default to combining them (user/role) in the message
            await MessageUtils.send(
                channel,
                !target && !role
                    ? Lang.getRef('types.user', LangCode.EN_US) +
                          '/' +
                          Lang.getRef('types.role', LangCode.EN_US)
                    : Lang.getEmbed('validation.userOrRoleNotInBlacklist', LangCode.EN_US, {
                          TYPE: Lang.getRef('types.' + (target ? 'user' : 'role'), LangCode.EN_US),
                      })
            );
            return;
        }

        await this.blacklistRepo.removeBlacklist(msg.guild.id, target ? target.id : role.id);

        await MessageUtils.send(
            channel,
            Lang.getEmbed('results.blacklistAddSuccess', LangCode.EN_US, {
                TARGET: target.toString(),
            })
        );
    }
}
