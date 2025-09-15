/**
 * You are free to add more unit types if you so wish. The ones included, not including m² and m³ which
 * are here just for convenience, are part of the specification and must be recognized by all
 * Homie-compatible consumers.
 * If you're dealing with multiples of these units, please perform a conversion instead of adding a
 * multiplier such as "k" or "m".
 *
 * @enum {string}
 */
const Unit = Object.freeze({
    DEGREE_C: "°C",
    DEGREE_F: "°F",
    DEGREE: "°",
    LITER: "L",
    GALLON: "gal",
    VOLT: "V",
    WATT: "W",
    AMPERE: "A",
    PERCENT: "%",
    METER: "m",
    FEET: "ft",
    PASCAL: "Pa",
    PSI: "psi",
    AMOUNT: "#",

    // Not part of the homie specification
    SECONDS: "s",
    MINUTES: "min",
    SQUARE_CENTIMETER: "cm²",
    SQUARE_METER: "m²",
    CUBE_METER: "m³",
    DECIBEL_MILLIWATT: "dBm",
});

module.exports = Unit;
