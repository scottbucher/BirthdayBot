export abstract class ArrayUtils {
    public static chooseRandom(items: any[]): any {
        return items[Math.floor(Math.random() * items.length)];
    }
}
