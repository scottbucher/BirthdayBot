export abstract class MathUtils {
    public static clamp(input: number, min: number, max: number): number {
        return Math.min(Math.max(input, min), max);
    }

    public static isLeap(year: number): boolean {
        return ((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0);
    }
}
