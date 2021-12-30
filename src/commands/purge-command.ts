import { ApplicationCommandData, CommandInteraction, Message } from 'discord.js';
import { ExpireFunction, MessageFilter } from 'discord.js-collector-utils';

import { Command } from './command';
import { EventData } from '../models/internal-models';
import { Lang } from '../services';
import { LangCode } from '../models/enums';
import { MessageUtils } from '../utils';
import { UserRepo } from '../services/database/repos';

export class PurgeCommand implements Command {
    public metadata: ApplicationCommandData = {
        name: Lang.getCom('commands.purge'),
        description: 'Remove your information from the database.',
    };
    public requireDev = false;
    public requireGuild = false;
    public requireSetup = false;
    public requireVote = false;
    public requirePremium = false;
    public getPremium = false;
    public requirePerms = [];

    constructor(private userRepo: UserRepo) {}

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        let target = intr.user;
        let userData = await this.userRepo.getUser(target.id);
        let stopFilter: MessageFilter = (nextMsg: Message) => nextMsg.author.id === intr.user.id;
        let expireFunction: ExpireFunction = async () => {
            await MessageUtils.sendIntr(intr, 'Yeets');
        };
    }
}
