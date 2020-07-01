export abstract class ParseUtils {
    public static parseInt(input: string): number {
        return parseInt(input.replace(/,/g, ''));
    }
}
