import { InvalidUtils, MessageUtils, PermissionUtils, FormatUtils } from '../../utils';
import { Message, TextChannel } from 'discord.js';

import { GuildRepo } from '../../services/database/repos';
import { Lang } from '../../services';
import { LangCode } from '../../models/enums';

const errorEmbed = Lang.getEmbed('validation.invalidChannelAction', LangCode.EN_US);

export class ConfigChannelSubCommand {
    constructor(private guildRepo: GuildRepo) { }

    public async execute(args: string[], msg: Message, channel: TextChannel): Promise<void> {
        let type = FormatUtils.extractCelebrationType(args[3]?.toLowerCase());

        if (
            !type ||
            (type !== 'birthday' && type !== 'memberanniversary' && type !== 'serveranniversary')
        ) {
            await MessageUtils.send(
                channel,
                Lang.getEmbed('validation.invalidChannelType', LangCode.EN_US)
            );
            return;
        }

        if (args.length === 4) {
            await MessageUtils.send(channel, errorEmbed);
            return;
        }

        let channelId = '0';

        let refType =
            (type === 'memberanniversary'
                ? 'memberAnniversary'
                : type === 'serveranniversary'
                    ? 'serverAnniversary'
                    : 'birthday') + 'Channel';

        if (args[4].toLowerCase() === 'create') {
            // User wants to create the default birthday channel
            if (!msg.guild.me.hasPermission('MANAGE_CHANNELS')) {
                await InvalidUtils.notEnoughPermissions(channel, ['MANAGE_CHANNELS']);
                return;
            }

            // Create channel with desired attributes
            let newChannel = await msg.guild.channels.create(
                Lang.getRef('terms.' + refType + 'Title', LangCode.EN_US),
                {
                    type: 'text',
                    topic: Lang.getRef('terms.' + refType + 'Topic', LangCode.EN_US),
                    permissionOverwrites: [
                        {
                            id: msg.guild.id,
                            deny: ['SEND_MESSAGES'],
                            allow: ['VIEW_CHANNEL'],
                        },
                        {
                            id: msg.guild.me.roles.cache.filter(role => role.managed).first(),
                            allow: [
                                'VIEW_CHANNEL',
                                'SEND_MESSAGES',
                                'EMBED_LINKS',
                                'ADD_REACTIONS',
                            ],
                        },
                    ],
                }
            );

            channelId = newChannel ? newChannel.id : '0';
            await MessageUtils.send(
                channel,
                Lang.getEmbed('results.' + refType + 'Created', LangCode.EN_US, {
                    CHANNEL: newChannel.toString(),
                })
            );
        } else if (args[4].toLowerCase() === 'clear') {
            // User wants to clear the birthday channel

            await MessageUtils.send(
                channel,
                Lang.getEmbed('results.' + refType + 'Cleared', LangCode.EN_US)
            );
        } else {
            // See if a channel was specified

            let newChannel: TextChannel = msg.mentions.channels.first();

            // If could not find in mention check, try to find by name
            if (!newChannel) {
                newChannel = msg.guild.channels.cache
                    .filter(channel => channel instanceof TextChannel)
                    .map(channel => channel as TextChannel)
                    .find(channel => channel.name.toLowerCase().includes(args[4].toLowerCase()));
            }

            // Could it find the channel in either check?
            if (!newChannel) {
                await MessageUtils.send(channel, errorEmbed);
                return;
            }

            // Bot needs to be able to message in the desired channel
            if (!PermissionUtils.canSend(channel)) {
                await InvalidUtils.cantSendInChannel(msg.channel as TextChannel, channel, [
                    'VIEW_CHANNEL',
                    'SEND_MESSAGES',
                    'EMBED_LINKS',
                    'ADD_REACTIONS',
                ]);
                return;
            }

            channelId = newChannel ? newChannel.id : '0';

            await MessageUtils.send(
                channel,
                Lang.getEmbed('results.' + refType + 'Set', LangCode.EN_US, {
                    CHANNEL: newChannel.toString(),
                })
            );
        }

        // Update the database with the channel
        type === 'birthday' ?
            await this.guildRepo.updateBirthdayChannel(msg.guild.id, channelId)
            : type === 'memberanniversary'
                ? await this.guildRepo.updateMemberAnniversaryChannel(msg.guild.id, channelId)
                : await this.guildRepo.updateServerAnniversaryChannel(msg.guild.id, channelId);
    }
}
