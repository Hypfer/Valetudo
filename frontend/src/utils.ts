//Adapted from https://stackoverflow.com/a/34270811/10951033
export function convertSecondsToHumans(seconds: number): string {
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
        },
        {
            value: (((seconds % 86400) % 3600) % 60).toString().padStart(2, "0"),
            label: "s"
        }
    ];
    let humanReadableTimespan = "";

    levels.forEach((lvl) => {
        humanReadableTimespan += lvl.value + lvl.label + " ";

    });

    return humanReadableTimespan.trim();
}
