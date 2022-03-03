import { StatsData, UserData } from './index.js';

export class UserDataResults {
    userData: UserData[];
    stats: StatsData;

    constructor(userDataRows: UserData[], statsRow: StatsData) {
        this.userData = userDataRows;
        this.stats = statsRow;
    }
}
