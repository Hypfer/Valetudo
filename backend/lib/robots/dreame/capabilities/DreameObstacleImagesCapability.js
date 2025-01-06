const DreameMiotHelper = require("../DreameMiotHelper");
const DreameMiotServices = require("../DreameMiotServices");
const DreameUtils = require("../DreameUtils");
const fs = require("fs");
const Logger = require("../../../Logger");
const ObstacleImagesCapability = require("../../../core/capabilities/ObstacleImagesCapability");


/**
 * @extends ObstacleImagesCapability<import("../DreameValetudoRobot")>
 */
class DreameObstacleImagesCapability extends ObstacleImagesCapability {
    constructor(options) {
        super(options);

        this.siid = DreameMiotServices["GEN2"].VACUUM_2.SIID;
        this.piid = DreameMiotServices["GEN2"].VACUUM_2.PROPERTIES.AI_CAMERA_SETTINGS.PIID;

        this.helper = new DreameMiotHelper({robot: this.robot});
    }

    /**
     * @returns {Promise<boolean>}
     */
    async isEnabled() {
        const res = await this.helper.readProperty(this.siid, this.piid);
        const deserializedRes = DreameUtils.DESERIALIZE_AI_SETTINGS(res);

        return deserializedRes.obstacleImages;
    }

    /**
     * @returns {Promise<void>}
     */
    async enable() {
        const res = await this.helper.readProperty(this.siid, this.piid);
        const deserializedRes = DreameUtils.DESERIALIZE_AI_SETTINGS(res);

        deserializedRes.obstacleImages = true;

        await this.helper.writeProperty(
            this.siid,
            this.piid,
            DreameUtils.SERIALIZE_AI_SETTINGS(deserializedRes)
        );
    }

    /**
     * @returns {Promise<void>}
     */
    async disable() {
        const res = await this.helper.readProperty(this.siid, this.piid);
        const deserializedRes = DreameUtils.DESERIALIZE_AI_SETTINGS(res);

        deserializedRes.obstacleImages = false;

        await this.helper.writeProperty(
            this.siid,
            this.piid,
            DreameUtils.SERIALIZE_AI_SETTINGS(deserializedRes)
        );
    }

    /*
     * @param {string} image
     * @returns {Promise<import('stream').Readable|null>}
     */
    async getStreamForImage(image) {
        if (!/^\/data\/record(?:\/ai_image)?\/\d+\.jpg$/.test(image)) {
            /*
                Attack scenario:
                someone somehow uploads a specially crafted map file containing a path for an obstacle image 
                that points somewhere that is no obstacle image
             */
            Logger.warn("Unexpected obstacle image path.");

            return null;
        }

        try {
            return fs.createReadStream(image, {
                highWaterMark: 32 * 1024,
                autoClose: true
            });
        } catch (err) {
            if (err.code === "ENOENT") {
                return null;
            } else {
                throw new Error(`Unexpected error while trying to read obstacle image: ${err.message}`);
            }
        }
    }
}

module.exports = DreameObstacleImagesCapability;
