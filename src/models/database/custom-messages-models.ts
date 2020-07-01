import { StatsData } from './stats-models';

export class CustomMessages {
    customMessages: CustomMessage[];
    stats: StatsData;

    constructor(customMessageRows: CustomMessage[], statsRow: StatsData) {
        this.customMessages = customMessageRows;
        this.stats = statsRow;
    }
}

export class CustomMessage {
    Message: string;
    Position: number;
}
