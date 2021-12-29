import { StatsData } from './stats-models';
import { UserData } from './user-models';

export class UserDataResults {
    userData: UserData[];
    stats: StatsData;

    constructor(userDataRows: UserData[], statsRow: StatsData) {
        this.userData = userDataRows;
        this.stats = statsRow;
    }
}
