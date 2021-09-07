import { Guild, Permissions } from 'discord.js';
import { Lang, Logger } from '../services';

import { EventHandler } from './event-handler';
import { LangCode } from '../models/enums';
import { MessageUtils } from '../utils';

let Logs = require('../../lang/logs.json');
export class GuildJoinHandler implements EventHandler {
    public async process(guild: Guild): Promise<void> {
        Logger.info(
            Logs.info.guildJoined
                .replace('{GUILD_NAME}', guild.name)
                .replace('{GUILD_ID}', guild.id)
        );
        // Get someone to message
        let target = await guild.fetchOwner();
        if (!target) {
            target = guild.members.cache.find(member =>
                member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)
            );
        }

        if (!target) return;

        let userChannel = await target.createDM();
        await MessageUtils.send(
            userChannel,
            Lang.getEmbed('info.guildJoin', LangCode.EN_US, {
                ICON: guild.client.user.displayAvatarURL(),
            })
        );
    }
}
