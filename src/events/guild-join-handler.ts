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
        let user = guild.owner;
        if (!user) {
            user = guild.members.cache.find(member =>
                member.hasPermission(Permissions.FLAGS.ADMINISTRATOR)
            );
        }

        if (!user) return;

        let userChannel = await user.createDM();
        await MessageUtils.send(
            userChannel,
            Lang.getEmbed('info.guildJoin', LangCode.EN_US, {
                ICON: guild.client.user.displayAvatarURL(),
            })
        );
    }
}
