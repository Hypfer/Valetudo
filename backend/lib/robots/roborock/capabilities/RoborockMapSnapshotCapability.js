const MapSnapshotCapability = require("../../../core/capabilities/MapSnapshotCapability");
const ValetudoMapSnapshot = require("../../../entities/core/ValetudoMapSnapshot");

/**
 * @extends MapSnapshotCapability<import("../RoborockValetudoRobot")>
 */
class RoborockMapSnapshotCapability extends MapSnapshotCapability {
    /**
     * @returns {Promise<Array<import("../../../entities/core/ValetudoMapSnapshot")>>}
     */
    async getSnapshots() {
        const res = await this.robot.sendCommand("get_recover_maps", [], {});

        if (Array.isArray(res)) {
            return res.map(e => {
                return new ValetudoMapSnapshot({id: e[0].toString(), timestamp: new Date(parseInt(e[1])*1000)});
            });
        } else {
            throw new Error("Received invalid response:" + res);
        }
    }

    /**
     * @param {import("../../../entities/core/ValetudoMapSnapshot")} snapshot
     * @returns {Promise<void>}
     */
    async restoreSnapshot(snapshot) {
        await this.robot.sendCommand("recover_map", [parseInt(snapshot.id)], {});
    }
}

module.exports = RoborockMapSnapshotCapability;
