import { RawTimeZone, rawTimeZones } from '@vvo/tzdb';

import { TimeUtils } from './index.js';

export class TimeZoneUtils {
    private static timeZones = TimeZoneUtils.buildTimeZoneList();

    private static buildTimeZoneList(): RawTimeZone[] {
        let timeZones = rawTimeZones
            .filter(timeZone => {
                let now = TimeUtils.now(timeZone.name);
                return now.isValid;
            })
            .sort((a, b) => (a.name > b.name ? 1 : -1));

        return timeZones;
    }

    public static find(input: string): RawTimeZone {
        return this.findMultiple(input, 1)[0];
    }

    public static findMultiple(input: string, limit: number = Number.MAX_VALUE): RawTimeZone[] {
        let search = input.split(' ').join('_').toLowerCase();
        let found = new Set<RawTimeZone>();
        // Exact match
        if (found.size < limit)
            this.timeZones
                .filter(timeZone => timeZone.name.toLowerCase() === search)
                .forEach(timeZone => found.add(timeZone));
        if (found.size < limit)
            this.timeZones
                .filter(timeZone => timeZone.group.some(name => name.toLowerCase() === search))
                .forEach(timeZone => found.add(timeZone));
        // Starts with search term
        if (found.size < limit)
            this.timeZones
                .filter(timeZone => timeZone.name.toLowerCase().startsWith(search))
                .forEach(timeZone => found.add(timeZone));
        if (found.size < limit)
            this.timeZones
                .filter(timeZone =>
                    timeZone.group.some(name => name.toLowerCase().startsWith(search))
                )
                .forEach(timeZone => found.add(timeZone));
        // Includes search term
        if (found.size < limit)
            this.timeZones
                .filter(timeZone => timeZone.name.toLowerCase().includes(search))
                .forEach(timeZone => found.add(timeZone));
        if (found.size < limit)
            this.timeZones
                .filter(timeZone =>
                    timeZone.group.some(name => name.toLowerCase().includes(search))
                )
                .forEach(timeZone => found.add(timeZone));
        return [...found];
    }
}
