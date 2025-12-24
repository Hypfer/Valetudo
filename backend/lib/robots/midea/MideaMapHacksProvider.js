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
        /** @type {{[key: string]: {material: number}}} */
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
     * @return {{[key: string]: {material: number}}}
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
                material: room.groundMaterialType ?? 0
            };
        }

        return this.lastRoomMetadata;
    }
}

const ROOM_DATA_PATH = "/oem/slam/room_cfg01.settings";

module.exports = MideaMapHacksProvider;
