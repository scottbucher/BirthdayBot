import { customAlphabet } from 'nanoid';

const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const NUMBERS = '0123456789';

export class RandomUtils {
    private static nanoid = customAlphabet(LOWERCASE + NUMBERS);

    public static intFromInterval(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    public static friendlyId(size: number): string {
        return this.nanoid(size);
    }
}
