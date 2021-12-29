import { UserData } from './user-models';

export interface SplitUsers {
    before: UserData[];
    after: UserData[];
}
