const MapResetCapability = require("../../../core/capabilities/MapResetCapability");

/**
 * @extends MapResetCapability<import("../RoborockValetudoRobot")>
 */
class RoborockMultiMapMapResetCapability extends MapResetCapability {
    /**
     * @returns {Promise<void>}
     */
    async reset() {
        if (this.robot.mapStatus === MAP_STATUS.NO_MAP) {
            throw new Error("Map doesn't exist. Nothing to reset.");
        }
        if (this.robot.mapStatus === MAP_STATUS.NEW_MAP) {
            // saving the map takes a bit of time, usually up to 5 secs
            let res = await this.robot.sendCommand("manual_segment_map", [{"map_flag":-1}], {timeout: 10000});
            if (!(Array.isArray(res) && res[0] === 1)) {
                throw new Error("Map is incomplete and not saved. Attempt to save map failed.");
            }

            await this.robot.pollState();
        }

        const multiMapId = MAP_STATUS_TO_MUTIMAP_ID[this.robot.mapStatus];
        if (multiMapId === undefined) {
            throw new Error("Unknown map status: " + this.robot.mapStatus + ". Unable to reset map.");
        }
        let res = await this.robot.sendCommand("del_map", [multiMapId], {});

        if (!(Array.isArray(res) && res[0] === "ok")) {
            throw new Error("Failed to reset map: " + res);
        }

        this.robot.clearValetudoMap();
    }
}

const MAP_STATUS = Object.freeze({
    NO_MAP: 252,
    NEW_MAP: 253, // a full clean-up hasn't been completed yet, map is incomplete and not saved into a slot
    MAP_0: 3,
    MAP_1: 7,
    MAP_2: 11,
    MAP_3: 15,
});

const MAP_STATUS_TO_MUTIMAP_ID = Object.freeze({
    [MAP_STATUS.MAP_0]: 0,
    [MAP_STATUS.MAP_1]: 1,
    [MAP_STATUS.MAP_2]: 2,
    [MAP_STATUS.MAP_3]: 3,
});

module.exports = RoborockMultiMapMapResetCapability;
