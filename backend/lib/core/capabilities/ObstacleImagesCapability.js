const Capability = require("./Capability");
const Logger = require("../../Logger");
const NotImplementedError = require("../NotImplementedError");
const PointMapEntity = require("../../entities/map/PointMapEntity");

/**
 *
 * @template {import("../ValetudoRobot")} T
 * @extends Capability<T>
 */
class ObstacleImagesCapability extends Capability {
    /*
     * @param {object} options
     * @param {T} options.robot
     * @param {import("../../utils/const").ImageFileFormat} options.fileFormat
     * @param {object} options.dimensions
     * @param {number} options.dimensions.height
     * @param {number} options.dimensions.width
     * @param {Array<import("../Quirk")>} [options.quirks]
     */
    constructor(options) {
        super(options);

        this.fileFormat = options.fileFormat;
        this.dimensions = options.dimensions;
    }

    /**
     *
     * @abstract
     * @returns {Promise<boolean>}
     */
    async isEnabled() {
        throw new NotImplementedError();
    }

    /**
     * @abstract
     * @returns {Promise<void>}
     */
    async enable() {
        throw new NotImplementedError();
    }

    /**
     * @abstract
     * @returns {Promise<void>}
     */
    async disable() {
        throw new NotImplementedError();
    }


    /**
     * @param {string} id
     * @returns {Promise<import('stream').Readable>}
     */
    async getStreamForId(id) {
        if (this.robot.config.get("embedded") !== true) {
            Logger.warn("Can't provide obstacle image since we're not embedded");

            return null;
        }

        // Even if files exist, the user will expect them to not be accessible when disabled
        // The downside is that each image fetch will contact the firmware and ask if the feature is enabled,
        // adding delay and overhead
        const isEnabled = await this.isEnabled();
        if (!isEnabled) {
            return null;
        }

        let map = this.robot.state.map;
        let obstacleEntity = map.entities.find(e => {
            return (
                e.type === PointMapEntity.TYPE.OBSTACLE &&
                e.metaData.id === id &&
                e.metaData.image !== undefined
            );
        });

        if (!obstacleEntity) {
            return null;
        }

        return this.getStreamForImage(obstacleEntity.metaData.image);
    }

    /**
     * This should only be called within the capability after resolving the ID
     * 
     * @protected
     * @abstract
     * @param {string} image
     * @returns {Promise<import('stream').Readable>}
     */
    async getStreamForImage(image) {
        throw new NotImplementedError();
    }

    /**
     * @returns {{fileFormat: import("../../utils/const").ImageFileFormat, dimensions: {height: number, width: number}}}
     */
    getProperties() {
        return {
            fileFormat: this.fileFormat,
            dimensions: this.dimensions
        };
    }

    getType() {
        return ObstacleImagesCapability.TYPE;
    }
}


ObstacleImagesCapability.TYPE = "ObstacleImagesCapability";

module.exports = ObstacleImagesCapability;
