/**
 * Convert a number of seconds to a string compatible with Homie's ISO8601
 * subset.
 *
 * @param {number} value
 * @return {string}
 */
function numberToDuration(value) {
    // We always provide the duration format specified in the specification
    let hours = Math.floor(value / 3600).toString(10);
    if (hours === "0") {
        hours = "";
    } else {
        hours += "H";
    }
    value %= 3600;

    let mins = Math.floor(value / 60).toString(10);
    if (mins === "0") {
        mins = "";
    } else {
        mins += "M";
    }
    const seconds = Math.floor(value % 60).toString(10) + "S";
    return "PT" + hours + mins + seconds;
}

/**
 * Convert ISO8601 duration to number of seconds
 *
 * @param {string} value
 * @return {number}
 */
function durationToNumber(value) {
    // We accept the full specification
    const regex = /^P((?<y>\d+)Y)?((?<m>\d+)M)?((?<d>\d+)D)?(T((?<th>\d+)H)?((?<tm>\d+)M)?((?<ts>\d+(.\d+)?)S)?)?$/;
    const match = regex.exec(value);
    let result = 0;
    result += parseInt(match.groups["y"] || "0") * 60 * 60 * 24 * 30 * 12;
    result += parseInt(match.groups["m"] || "0") * 60 * 60 * 24 * 30;
    result += parseInt(match.groups["d"] || "0") * 60 * 60 * 24;
    result += parseInt(match.groups["th"] || "0") * 60 * 60;
    result += parseInt(match.groups["tm"] || "0") * 60;
    result += parseFloat(match.groups["ts"] || "0");
    return result;
}

module.exports = {
    numberToDuration: numberToDuration,
    durationToNumber: durationToNumber
};
