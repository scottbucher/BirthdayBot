export class VoteData {
    BotDiscordId: string;
    UserDiscordId: string;
    Type: string;
    IsWeekend: boolean;D
    Query: string;

    constructor(
        private body
        ) {
            this.BotDiscordId = body.bot;
            this.UserDiscordId = body.user;
            this.Type = body.type;
            this.IsWeekend = body.IsWeekend;
            this.Query = body.query;
        }
}
