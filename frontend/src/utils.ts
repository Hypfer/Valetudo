//Adapted from https://stackoverflow.com/a/34270811/10951033
import {ValetudoDataPoint} from "./api";

export function convertSecondsToHumans(seconds: number, showSeconds = true, showDays = true): string {
    let levels = [];

    if (showDays) {
        levels = [
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
            }
        ];


        if (showSeconds) {
            levels.push(
                {
                    value: (((seconds % 86400) % 3600) % 60).toString().padStart(2, "0"),
                    label: "s"
                }
            );
        }
    } else {
        levels = [
            {
                value: Math.floor(seconds / 3600).toString().padStart(2, "0"),
                label: "h"
            },
            {
                value: Math.floor((seconds % 3600) / 60).toString().padStart(2, "0"),
                label: "m"
            }
        ];


        if (showSeconds) {
            levels.push(
                {
                    value: ((seconds % 3600) % 60).toString().padStart(2, "0"),
                    label: "s"
                }
            );
        }
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

// Adapted from https://stackoverflow.com/a/53660837
export const median = (numbers: Array<number>): number => { //Note that this will modify the input array
    numbers.sort((a, b) => {
        return a - b;
    });

    const middle = Math.floor(numbers.length / 2);

    if (numbers.length % 2 === 0) {
        return (numbers[middle - 1] + numbers[middle]) / 2;
    }

    return numbers[middle];
};

export function getFriendlyStatName(stat: ValetudoDataPoint) : string {
    switch (stat.type) {
        case "area":
            return "Area";
        case "time":
            return "Time";
        case "count":
            return "Count";
    }
}

export function getHumanReadableStatValue(stat: ValetudoDataPoint): string {
    switch (stat.type) {
        case "area":
            return (stat.value / 10000).toFixed(2).padStart(6, "0") + " m²";
        case "time":
            return convertSecondsToHumans(stat.value, true, false);
        case "count":
            return stat.value.toString();
    }
}

//adapted from https://stackoverflow.com/a/60880664
export function adjustColorBrightness(hexInput: string, percent: number) : string {
    let hex = hexInput;

    // strip the leading # if it's there
    hex = hex.trim().replace("#","");

    // convert 3 char codes --> 6, e.g. `E0F` --> `EE00FF`
    if (hex.length === 3) {
        hex = hex.replace(/(.)/g, "$1$1");
    }

    let r = parseInt(hex.substr(0, 2), 16);
    let g = parseInt(hex.substr(2, 2), 16);
    let b = parseInt(hex.substr(4, 2), 16);

    const calculatedPercent = (100 + percent) / 100;

    r = Math.round(Math.min(255, Math.max(0, r * calculatedPercent)));
    g = Math.round(Math.min(255, Math.max(0, g * calculatedPercent)));
    b = Math.round(Math.min(255, Math.max(0, b * calculatedPercent)));

    let result = "#";

    result += r.toString(16).toUpperCase().padStart(2, "0");
    result += g.toString(16).toUpperCase().padStart(2, "0");
    result += b.toString(16).toUpperCase().padStart(2, "0");

    return result;
}

