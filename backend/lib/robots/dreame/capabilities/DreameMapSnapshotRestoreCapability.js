const DreameMiotHelper = require("../DreameMiotHelper");
const MapSnapshotRestoreCapability = require("../../../core/capabilities/MapSnapshotRestoreCapability");

/**
 * @extends MapSnapshotRestoreCapability<import("../DreameValetudoRobot")>
 */
class DreameMapSnapshotRestoreCapability extends MapSnapshotRestoreCapability {
    /**
     * @param {object} options
     * @param {import("../DreameValetudoRobot")} options.robot
     * @param {import("../DreameMapSnapshotStore")} options.mapSnapshotStore
     * 
     * @param {number} options.siid MIOT Service ID
     * @param {number} options.piid MIOT Property ID
     * @param {string} options.urlPrefix
     */
    constructor(options) {
        super(options);
        
        this.mapSnapshotStore = options.mapSnapshotStore;
        this.helper = new DreameMiotHelper({robot: this.robot});

        this.siid = options.siid;
        this.piid = options.piid;
        
        this.urlPrefix = options.urlPrefix
    }

    
    /**
     * @returns {Promise<Array<import("../../../entities/core/ValetudoMapSnapshot")>>}
     */
    async getSnapshots() {
        return this.mapSnapshotStore.getSnapshots()
    }

    /**
     * @param {import("../../../entities/core/ValetudoMapSnapshot")} snapshot
     * @returns {Promise<void>}
     */
    async restoreSnapshot(snapshot) {
        const snap = this.mapSnapshotStore.getSnapshots().find(s => {
            return s.id === snapshot.id;
        })
        
        if (!snap) {
            throw new Error("Missing Snapshot");
        }
        
        return this.helper.writeProperty(this.siid, this.piid, JSON.stringify({
            map_id: snap.metaData.vendorMapId,
            map_url: `${this.urlPrefix}/mapSnapshots/${snap.id}`
        }));
    }
}

module.exports = DreameMapSnapshotRestoreCapability;
