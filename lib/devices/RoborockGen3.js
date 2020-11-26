const RoborockS5 = require("./RoborockS5");
const RRMapParser = require("../RRMapParser");

/*
    This class is a hackish way to support S6/S5 Max without changing much of the code
    The correct way to do this would be a feature component system
 */
class RoborockGen3 extends RoborockS5 {
    constructor(options) {
        super(options);

        //These are always gen3
        this.isGen3 = true;
    }

    parseStatus(res) {
        super.parseStatus(res);
        this.isGen3 = true;
    }

    detectFanSpeeds(msg_ver) {
        super.detectFanSpeeds(3); //lol hack
    }

    /**
     * Saves the persistent data like virtual walls, nogo zones, and no-mop zones
     * They have to be provided in the following format:
     *      https://github.com/marcelrv/XiaomiRobotVacuumProtocol/issues/15#issuecomment-447647905
     *      Software barrier takes a vector of [id, x1,y1,x2,y2]
     *      And no-go zone takes [id, x1,y1,x2,y2,x3,y3,x4,y4], which are the corners of the zone rectangle?
     *      Edit: see @JensBuchta's comment. The first parameter appears to be a type: 0 = zone, 1 = barrier, 2 = no-mop zone
     *
     * @param {any} persistantData
     */
    async savePersistentData(persistantData) { //TODO: Store in valetudo config
        if (Array.isArray(persistantData)) {
            const flippedYCoordinates = persistantData.map(data => {
                if (data[0] === PERSISTENT_DATA_TYPES.ZONE || data[0] === PERSISTENT_DATA_TYPES.NOMOP) {
                    // this is a no-go zone or a no-mop zone
                    return [
                        data[0],
                        data[1] * 10,
                        RRMapParser.DIMENSION_MM - data[2] * 10,
                        data[3] * 10,
                        RRMapParser.DIMENSION_MM - data[4] * 10,
                        data[5] * 10,
                        RRMapParser.DIMENSION_MM - data[6] * 10,
                        data[7] * 10,
                        RRMapParser.DIMENSION_MM - data[8] * 10
                    ];
                } else {
                    // this is a barrier
                    return [
                        data[0],
                        data[1] * 10,
                        RRMapParser.DIMENSION_MM - data[2] * 10,
                        data[3] * 10,
                        RRMapParser.DIMENSION_MM - data[4] * 10,
                    ];
                }
            });

            if (flippedYCoordinates.reduce((total, currentElem) => {
                return total += currentElem[0] === PERSISTENT_DATA_TYPES.ZONE ? 4 : 2;
            }, 0) > 68) {
                throw new Error("too many forbidden markers to save!");
            }


            this.sendCommand("save_map", flippedYCoordinates, {timeout: 3500}).finally(() => {
                this.pollMap();
            });
        } else {
            throw new Error("persistantData has to be an array.");
        }
    }


}

/** @enum {number} */
const PERSISTENT_DATA_TYPES = {
    "ZONE": 0,
    "BARRIER": 1,
    "NOMOP": 2
};

module.exports = RoborockGen3;