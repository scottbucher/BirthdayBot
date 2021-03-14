export class MathUtils {
    public static sum(numbers: number[]): number {
        return numbers.reduce((a, b) => a + b, 0);
    }

    public static clamp(input: number, min: number, max: number): number {
        return Math.min(Math.max(input, min), max);
    }

    public static range(start: number, size: number): number[] {
        return [...Array(size).keys()].map(i => i + start);
    }

    public static ceilToMultiple(input: number, multiple: number): number {
        return Math.ceil(input / multiple) * multiple;
    }

    public static isLeap(year: number): boolean {
        return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    }
}
