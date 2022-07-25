const fs = require("fs");
const Logger = require("../../Logger");
const path = require("path");
const Tools = require("../../utils/Tools");
const uuid = require("uuid");
const ValetudoMapSnapshot = require("../../entities/core/ValetudoMapSnapshot");

class DreameMapSnapshotStore {
    constructor() {
        this.location = "/data/valetudo_map_snapshots";
        this.manifestLocation = path.join(this.location,DreameMapSnapshotStore.MANIFEST_NAME);

        this.manifest = {
            version: 1,
            snapshots: []
        };
    }

    initialize() {
        if (fs.existsSync(this.manifestLocation)) {
            try {
                const manifestFromDisk = fs.readFileSync(this.manifestLocation, {"encoding": "utf-8"}).toString();
                const parsedManifest = JSON.parse(manifestFromDisk);

                this.manifest.snapshots = parsedManifest.snapshots.map(s => {
                    return new ValetudoMapSnapshot({
                        id: s.id,
                        timestamp: s.timestamp,
                        metaData: s.metaData
                    });
                });
            } catch (e) {
                Logger.error("Invalid DreameMapSnapshotStore manifest: ", e.message);

                try {
                    Tools.MK_DIR_PATH(path.dirname(this.manifestLocation));

                    const currentContents = fs.readdirSync(this.location);
                    currentContents.forEach(fileName => {
                        fs.rmSync(path.join(this.location, fileName));
                    });
                } catch (e) {
                    Logger.error("Cleanup of map snapshot location failed ", e.message);
                }


                this.persist();
            }
        } else {
            Tools.MK_DIR_PATH(path.dirname(this.manifestLocation));

            this.persist();
        }
    }

    persist() {
        fs.writeFileSync(this.manifestLocation, JSON.stringify(this.manifest, null, 2));
    }

    /**
     * @public
     * @returns {Array<ValetudoMapSnapshot>}
     */
    getSnapshots() {
        return this.manifest.snapshots;
    }

    /**
     * 
     * @param {string} id
     * @returns {null|Buffer}
     */
    getSnapshotFileById(id) {
        //Make sure to check that the ID exists so that nothing requests e.g. id "../../../etc/passwd"
        const snapshot = this.manifest.snapshots.find(s => {
            return s.id === id
        });
        
        if (snapshot) {
            try {
                return fs.readFileSync(path.join(this.location, snapshot.id)); //TODO: promise?
            } catch(e) {
                Logger.warn(`Error while reading map snapshot ${snapshot.id} file from disk`, e)
                
                return null;
            }
        } else {
            return null;
        }
    }

    /**
     * 
     * @param {Buffer} buf
     * @param {number} vendorMapId
     * 
     * @returns {Promise<void>}
     */
    async storeSnapshot(buf, vendorMapId) {
        const id = uuid.v4();
        const snapshot = new ValetudoMapSnapshot({
            id: id,
            timestamp: new Date(),
            metaData: {
                vendorMapId: vendorMapId
            }
        });

        try {
            await fs.promises.writeFile(path.join(this.location, id), buf);
        } catch (e) {
            Logger.warn(`Error while storing map snapshot ${id}`, e);

            return; //abort
        }

        this.manifest.snapshots.push(snapshot);

        //TODO: make sure that the order is correct
        this.manifest.snapshots.sort((a, b) => {
            return b.timestamp.getTime() - a.timestamp.getTime();
        });

        if (this.manifest.snapshots.length > DreameMapSnapshotStore.SNAPSHOT_LIMIT) {
            const oldestSnapshot = this.manifest.snapshots.pop();

            try {
                fs.rmSync(path.join(this.location, oldestSnapshot.id));
            } catch (e) {
                Logger.warn(`Error while deleting map snapshot ${id}`, e);

                return; //abort
            }
        }

        Logger.info(`Stored new map snapshot. ID: ${id}, VendorMapId: ${vendorMapId}`);

        this.persist();
    }
}

DreameMapSnapshotStore.MANIFEST_NAME = "manifest.json";
DreameMapSnapshotStore.SNAPSHOT_LIMIT = 3;

module.exports = DreameMapSnapshotStore;
