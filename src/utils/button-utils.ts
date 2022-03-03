import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let Config = require('../../config/config.json');

export class ButtonUtils {
    public static getNewPageNum(pageNum: number, name: string): number {
        switch (name) {
            case 'previous':
                return pageNum - 1;
            case 'next':
                return pageNum + 1;
            case 'previous_more':
                return pageNum - (Config.experience.morePageCount as number);
            case 'next_more':
                return pageNum + (Config.experience.morePageCount as number);
            case 'refresh':
                return pageNum;
            default:
                return;
        }
    }
}
