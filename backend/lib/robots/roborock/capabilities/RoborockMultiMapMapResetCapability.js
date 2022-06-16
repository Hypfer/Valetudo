const MapResetCapability = require("../../../core/capabilities/MapResetCapability");
const RobotFirmwareError = require("../../../core/RobotFirmwareError");

/**
 * @extends MapResetCapability<import("../RoborockValetudoRobot")>
 */
class RoborockMultiMapMapResetCapability extends MapResetCapability {
    /**
     * @returns {Promise<void>}
     */
    async reset() {
        if (!this.robot.mapStatus) {
            throw new Error("Unknown map status: " + this.robot.mapStatus + ". Unable to reset map.");
        }

        if (this.robot.mapStatus.mapPresent === false) {
            throw new Error("Map doesn't exist. Nothing to reset.");
        }


        /*
            63 means new map and isn't a proper map slot ID
            We're trying to manually trigger the segmentation to store the map into a real map slot
         */
        if (this.robot.mapStatus.mapSlotId === 63) {
            // segmenting the map takes a bit of time, usually up to 5 secs
            let res = await this.robot.sendCommand("manual_segment_map", [{"map_flag":-1}], {timeout: 10000});

            if (!(Array.isArray(res) && res[0] === 1)) {
                throw new Error("Map is incomplete and not saved. Attempt to segment map failed.");
            }

            await this.robot.pollState();
        }



        let res = await this.robot.sendCommand("del_map", [this.robot.mapStatus.mapSlotId], {});

        if (!(Array.isArray(res) && res[0] === "ok")) {
            throw new RobotFirmwareError("Failed to reset map: " + res);
        }

        this.robot.clearValetudoMap();
    }
}


module.exports = RoborockMultiMapMapResetCapability;
