export class ParseUtils {
    public static parseInt(input: string): number {
        let int: number;
        try {
            int = parseInt(input.replace(/,/g, ''));
        } catch {
            return;
        }
        return int;
    }
}
