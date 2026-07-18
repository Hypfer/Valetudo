const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");

/**
 * @template {import("../ValetudoRobot")} T
 * @extends Capability<T>
 */
class MapAnnotationsCapability extends Capability {
    /**
     *
     * @param {object} options
     * @param {T} options.robot
     * @param {Array<import("../../entities/core/ValetudoMapAnnotation").ValetudoMapAnnotationType>} options.supportedAnnotationTypes
     * @class
     */
    constructor(options) {
        super(options);

        this.supportedAnnotationTypes = options.supportedAnnotationTypes ?? [];
    }

    /**
     *
     * @param {Array<import("../../entities/core/ValetudoMapAnnotation")>} mapAnnotations
     * @returns {Promise<void>}
     */
    async setMapAnnotations(mapAnnotations) {
        throw new NotImplementedError();
    }

    /**
     * @returns {MapAnnotationsCapabilityProperties}
     */
    getProperties() {
        return {
            supportedAnnotationTypes: this.supportedAnnotationTypes
        };
    }

    getType() {
        return MapAnnotationsCapability.TYPE;
    }
}

MapAnnotationsCapability.TYPE = "MapAnnotationsCapability";

module.exports = MapAnnotationsCapability;

/**
 * @typedef {object} MapAnnotationsCapabilityProperties
 *
 * @property {Array<import("../../entities/core/ValetudoMapAnnotation").ValetudoMapAnnotationType>} supportedAnnotationTypes
 */
