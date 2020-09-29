import { promisify } from 'util';

let setTimeoutAsync = promisify(setTimeout);

export abstract class TimeUtils {
    public static async sleep(ms: number): Promise<void> {
        return await setTimeoutAsync(ms);
    }
}