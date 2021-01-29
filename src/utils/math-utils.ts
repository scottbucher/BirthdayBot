export class MathUtils {
    public static bytesToMB(bytes: number): number {
        return Math.round((bytes / 1024 / 1024) * 100) / 100;
    }

    public static clamp(input: number, min: number, max: number): number {
        return Math.min(Math.max(input, min), max);
    }

    public static isLeap(year: number): boolean {
        return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    }
}
