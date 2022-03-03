import { GuildData, Vote } from './index.js';

export class GuildDataAndVote {
    guildData: GuildData;
    voteData: Vote;

    constructor(guildData: GuildData, voteData: Vote) {
        this.guildData = guildData;
        this.voteData = voteData;
    }
}
