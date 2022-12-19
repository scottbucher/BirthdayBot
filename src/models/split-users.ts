import { UserData } from '../database/entities/user.js';

export interface SplitUsers {
    before: UserData[];
    after: UserData[];
}
