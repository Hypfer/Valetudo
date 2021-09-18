//Adapted from https://stackoverflow.com/a/34270811/10951033
export function convertSecondsToHumans(seconds: number, showSeconds = true): string {
    const levels = [
        {
            value: Math.floor(seconds / 86400),
            label: "d"
        },
        {
            value: Math.floor((seconds % 86400) / 3600).toString().padStart(2, "0"),
            label: "h"
        },
        {
            value: Math.floor(((seconds % 86400) % 3600) / 60).toString().padStart(2, "0"),
            label: "m"
        }];

    if (showSeconds) {
        levels.push(
            {
                value: (((seconds % 86400) % 3600) % 60).toString().padStart(2, "0"),
                label: "s"
            }
        );
    }

    let humanReadableTimespan = "";

    levels.forEach((lvl) => {
        humanReadableTimespan += lvl.value + lvl.label + " ";
    });

    return humanReadableTimespan.trim();
}

// Adapted from https://gist.github.com/erikvullings/ada7af09925082cbb89f40ed962d475e
export const deepCopy = <T>(target: T): T => {
    if (target === null) {
        return target;
    }
    if (target instanceof Date) {
        return new Date(target.getTime()) as any;
    }
    if (target instanceof Array) {
        const cp = [] as any[];
        (target as any[]).forEach((v) => {
            cp.push(v);
        });
        return cp.map((n: any) => {
            return deepCopy<any>(n);
        }) as any;
    }
    if (typeof target === "object" && Object.keys(target).length !== 0) {
        const cp = {...(target as { [key: string]: any })} as { [key: string]: any };
        Object.keys(cp).forEach(k => {
            cp[k] = deepCopy<any>(cp[k]);
        });
        return cp as T;
    }
    return target;
};

const consumableTypeMapping: Record<string, string> = {
    "brush": "Brush",
    "filter": "Filter",
    "sensor": "Sensor cleaning",
    "mop": "Mop"
};

const consumableSubtypeMapping: Record<string, string> = {
    "main": "Main",
    "side_right": "Right",
    "side_left": "Left",
    "all": "",
    "none": ""
};

export const getConsumableName = (type: string, subType?: string): string => {
    let ret = "";
    if (subType && subType in consumableSubtypeMapping) {
        ret += consumableSubtypeMapping[subType] + " ";
    }
    if (type in consumableTypeMapping) {
        ret += consumableTypeMapping[type];
    }
    return ret.trim() || "Unknown consumable: " + type + ", " + subType;
};
