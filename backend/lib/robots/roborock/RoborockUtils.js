class RoborockUtils {
    /**
     * 
     * @param {number} input
     * @return {RoborockCameraSettings}
     */
    static DESERIALIZE_CAMERA_SETTINGS(input) {
        return {
            obstacleAvoidanceEnabled: !!(input &0b00000001),
            petObstacleAvoidanceEnabled: !!(input &0b00000010)
        };
    }

    /**
     * 
     * @param {RoborockCameraSettings} settings
     * @return {number}
     */
    static SERIALIZE_CAMERA_SETTINGS(settings) {
        let result = 0 >>> 0;

        result |= ((settings.obstacleAvoidanceEnabled ? 1 : 0) << 0);
        result |= ((settings.petObstacleAvoidanceEnabled ? 1 : 0) << 1);

        return result;
    }
}

/**
 * @typedef {object} RoborockCameraSettings
 * @property {boolean} obstacleAvoidanceEnabled
 * @property {boolean} petObstacleAvoidanceEnabled
 */

module.exports = RoborockUtils;
