import { Message, MessageEmbed, TextChannel } from 'discord.js';

import { BlacklistRepo } from '../../services/database/repos';
import { GuildUtils } from '../../utils';

let Config = require('../../../config/config.json');

export class BlacklistListSubCommand {
    constructor(private blacklistRepo: BlacklistRepo) {}

    public async execute(args: string[], msg: Message, channel: TextChannel) {
        // Do Stuff
    }
}
