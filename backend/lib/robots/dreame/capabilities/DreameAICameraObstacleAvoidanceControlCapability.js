const DreameMiotHelper = require("../DreameMiotHelper");
const DreameMiotServices = require("../DreameMiotServices");
const DreameUtils = require("../DreameUtils");
const ObstacleAvoidanceControlCapability = require("../../../core/capabilities/ObstacleAvoidanceControlCapability");

/**
 * @extends ObstacleAvoidanceControlCapability<import("../DreameValetudoRobot")>
 */
class DreameAICameraObstacleAvoidanceControlCapability extends ObstacleAvoidanceControlCapability {

    /**
     * @param {object} options
     * @param {import("../DreameValetudoRobot")} options.robot
     */
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

        return deserializedRes.obstacleDetection;
    }

    /**
     * @returns {Promise<void>}
     */
    async enable() {
        const res = await this.helper.readProperty(this.siid, this.piid);
        const deserializedRes = DreameUtils.DESERIALIZE_AI_SETTINGS(res);

        deserializedRes.obstacleDetection = true;

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

        deserializedRes.obstacleDetection = false;

        await this.helper.writeProperty(
            this.siid,
            this.piid,
            DreameUtils.SERIALIZE_AI_SETTINGS(deserializedRes)
        );
    }
}

module.exports = DreameAICameraObstacleAvoidanceControlCapability;
