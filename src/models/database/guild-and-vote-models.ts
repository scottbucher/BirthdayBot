import { GuildData, VoteData } from './index.js';

export class GuildAndVoteData {
    guildData: GuildData;
    voteData: VoteData;

    constructor(guildData: GuildData, voteData: VoteData) {
        this.guildData = guildData;
        this.voteData = voteData;
    }
}
