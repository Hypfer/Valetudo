const fs = require("fs");

const entities = require("../../entities");
const Logger = require("../../Logger");

const stateAttrs = entities.state.attributes;

/*
    This class houses a bunch of ugly hacks that are necessary because Valetudo behaves a bit different from the cloud
    Since it doesn't have persistence, it cannot cache data the same way the real cloud would.
    
    Additionally, there is a workaround in here that handles the path data being the only source for the robot position
    and with that, a docked robot sometimes for some reason not rendering as docked.
    I think in normal usage, the app does the same fakery?
    
    Essentially, this class exists because Valetudo tries its best to hide the jank from the user
 */

class MideaMapHacksProvider {
    /**
     * @param {object} options
     * @param {import("./MideaValetudoRobot")} options.robot
     */
    constructor(options) {
        this.robot = options.robot;

        this.lastRoomMetadataUpdate = undefined;
        /** @type {{[key: string]: {material: number, name?: string}}} */
        this.lastRoomMetadata = {};
    }

    /**
     * @return {boolean}
     */
    get isDocked() {
        const statusStateAttribute = this.robot.state.getFirstMatchingAttributeByConstructor(stateAttrs.StatusStateAttribute);

        return statusStateAttribute?.value === stateAttrs.StatusStateAttribute.VALUE.DOCKED;
    }

    /**
     * @return {{[key: string]: {material: number, name?: string}}}
     */
    getRoomMetadata() {
        if (this.robot.config.get("embedded") !== true) {
            return {};
        }

        const roomDataStat = fs.statSync(ROOM_DATA_PATH, {throwIfNoEntry: false});
        if (!roomDataStat) {
            this.lastRoomMetadataUpdate = undefined;
            this.lastRoomMetadata = {};

            return this.lastRoomMetadata;
        }

        if (roomDataStat.mtimeMs === this.lastRoomMetadataUpdate) {
            return this.lastRoomMetadata;
        }

        let roomData;
        try {
            const rawRoomData = fs.readFileSync(ROOM_DATA_PATH);
            roomData = JSON.parse(rawRoomData.toString());
        } catch (e) {
            Logger.warn("Error while reading room metadata", e);

            return {};
        }

        this.lastRoomMetadataUpdate = roomDataStat.mtimeMs;
        this.lastRoomMetadata = {};

        for (const room of roomData.rooms ?? []) {
            this.lastRoomMetadata[room.id] = {
                material: room.groundMaterialType ?? 0,
                name: room.name
            };
        }

        return this.lastRoomMetadata;
    }

    setName(roomId, newName) {
        if (this.robot.config.get("embedded") !== true) {
            throw new Error("Only possible when embedded");
        }

        let originalStat;
        try {
            originalStat = fs.statSync(ROOM_DATA_PATH);
        } catch (e) {
            throw new Error("Missing room metadata");
        }

        let roomData;
        try {
            const rawRoomData = fs.readFileSync(ROOM_DATA_PATH);
            roomData = JSON.parse(rawRoomData.toString());
        } catch (e) {
            Logger.warn("Error while reading room metadata", e);

            throw new Error("Could not read room metadata");
        }

        const room = (roomData.rooms ?? []).find(r => `${r.id}` === `${roomId}`);
        if (!room) {
            throw new Error(`Room ${roomId} not found`);
        }

        room.name = newName;

        const tempPath = ROOM_DATA_PATH + ".tmp";
        try {
            fs.writeFileSync(tempPath, JSON.stringify(roomData));

            fs.chownSync(tempPath, originalStat.uid, originalStat.gid);
            fs.chmodSync(tempPath, originalStat.mode);

            fs.renameSync(tempPath, ROOM_DATA_PATH);
        } catch (e) {
            try {
                if (fs.existsSync(tempPath)) {
                    fs.unlinkSync(tempPath);
                }
            } catch (cleanupError) {
                Logger.warn("Failed to delete tmp file", cleanupError);
            }

            Logger.error("Failed to store room metadata", e);
            throw e;
        }
    }
}

const ROOM_DATA_PATH = "/oem/slam/room_cfg02.settings"; // ID 02 seems to be the first stored map? I think?

module.exports = MideaMapHacksProvider;
