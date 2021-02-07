const MapSnapshotCapability = require("../../../core/capabilities/MapSnapshotCapability");
const ValetudoMapSnapshot = require("../../../entities/core/ValetudoMapSnapshot");

class RoborockMapSnapshotCapability extends MapSnapshotCapability {
    /**
     * @returns {Promise<Array<import("../../../entities/core/ValetudoMapSnapshot")>>}
     */
    async getSnapshots() {
        const res = await this.robot.sendCommand("get_recover_maps", [], {});

        return res.map(e => new ValetudoMapSnapshot({id: e[0], timestamp: new Date(parseInt(e[1])*1000)}));
    }

    /**
     * @param {import("../../../entities/core/ValetudoMapSnapshot")} snapshot
     * @returns {Promise<void>}
     */
    async restoreSnapshot(snapshot) {
        await this.robot.sendCommand("recover_map", [snapshot.id], {});
    }
}

module.exports = RoborockMapSnapshotCapability;
