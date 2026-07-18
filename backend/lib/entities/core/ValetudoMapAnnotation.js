const SerializableEntity = require("../SerializableEntity");


// noinspection JSUnusedGlobalSymbols
/**
 * @class ValetudoMapAnnotation
 * @property {ValetudoMapAnnotationType} type
 * @property {Array<{x: number, y: number}>} points
 */
class ValetudoMapAnnotation extends SerializableEntity {
    /**
     * @param {object} options
     * @param {ValetudoMapAnnotationType} options.type
     * @param {Array<{x: number, y: number}>} options.points
     * @param {object} [options.metaData]
     */
    constructor(options) {
        super(options);

        this.type = options.type;

        if (!Array.isArray(options.points) || options.points.length < 2) {
            throw new Error("Annotations require at least 2 points");
        }

        this.points = options.points;
    }
}

/**
 *  @typedef {string} ValetudoMapAnnotationType
 *  @enum {string}
 *
 */
ValetudoMapAnnotation.TYPE = Object.freeze({
    THRESHOLD: "threshold",
    CURTAIN: "curtain",

    RAMP: "ramp",
});

module.exports = ValetudoMapAnnotation;
