export class ParseUtils {
    public static parseInt(input: string): number {
        let number: number;
        try {
            number = parseInt(input.replace(/,/g, ''));
        } catch {
            return;
        }
        return number;
    }
}
