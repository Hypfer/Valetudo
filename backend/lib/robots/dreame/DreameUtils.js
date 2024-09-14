const UINT8_MASK = 0b00000000000000000000000011111111;

/**
 * Dreame stores all three configurables of their mop docks in a single PIID as one int
 * This int consists of three ints like so (represented here as an 32 bit int because js bitwise operations use those):
 *
 * XXXXXXXXWWWWWWWWPPPPPPPPOOOOOOOO
 *
 * where
 * - X is nothing
 * - W is the water grade (wetness of the mop pads)
 * - P is the pad cleaning frequency (apparently in m² plus 0 for "after each segment")
 * - O is the operation mode (mop, vacuum & mop, vacuum)
 *
 */

class DreameUtils {
    /**
     *
     * @param {number} input
     * @return {MOP_DOCK_SETTINGS}
     */
    static DESERIALIZE_MOP_DOCK_SETTINGS(input) {
        return {
            operationMode: input >>> 0 & UINT8_MASK,
            padCleaningFrequency: input >>> 8 & UINT8_MASK,
            waterGrade: input >>> 16 & UINT8_MASK
        };
    }

    /**
     *
     * @param {MOP_DOCK_SETTINGS} settings
     * @return {number}
     */
    static SERIALIZE_MOP_DOCK_SETTINGS(settings) {
        let result = 0 >>> 0;

        result |= (settings.waterGrade & UINT8_MASK);
        result <<= 8;

        result |= (settings.padCleaningFrequency & UINT8_MASK);
        result <<= 8;

        result |= (settings.operationMode & UINT8_MASK);

        return result;
    }

    /**
     * 
     * @param {string} str
     * @return {MISC_TUNABLES}
     */
    static DESERIALIZE_MISC_TUNABLES(str) {
        const arr = JSON.parse(str);
        const result = {};

        arr.forEach(elem => {
            result[elem.k] = elem.v;
        });

        return result;
    }

    /**
     *
     * @param {MISC_TUNABLES} obj
     * @return {string}
     */
    static SERIALIZE_MISC_TUNABLES_SINGLE_TUNABLE(obj) {
        const arr = [];

        Object.entries(obj).forEach(([k, v]) => {
            arr.push({k: k, v: v});
        });

        return JSON.stringify(arr[0]);
    }

    /**
     * 
     * @param {number} input
     * @return {AI_SETTINGS}
     */
    static DESERIALIZE_AI_SETTINGS(input) {
        return {
            obstacleDetection: !!(input & 0b00000010),
            obstacleImages: !!(input & 0b00000100),
            petObstacleDetection: !!(input & 0b00010000),
        };
    }

    /**
     * @param {AI_SETTINGS} input
     * @return {number}
     */
    static SERIALIZE_AI_SETTINGS(input) {
        let serializedValue = 0;

        serializedValue |= input.obstacleDetection ? 0b00000010 : 0;
        serializedValue |= input.obstacleImages ? 0b00000100 : 0;
        serializedValue |= input.petObstacleDetection ? 0b00010000 : 0;

        return serializedValue;
    }
}

// It seems that everything the AI models can detect shares the same ID space
DreameUtils.AI_CLASSIFIER_IDS = Object.freeze({
    "0": "Unknown",
    "1": "Bedside Table",
    "2": "Wall Air Conditioner",
    "3": "Chair",
    "4": "Unknown",
    "5": "End Table",
    "6": "TV Monitor",
    "7": "TV Cabinet",
    "8": "Dining Table",
    "9": "Range Hood",
    "10": "Cupboard",
    "11": "Gas Water Heater",
    "12": "Toilet",
    "13": "Shower Head",
    "14": "Electric Water Heater",
    "15": "Refrigerator",
    "16": "Washer Dryer",

    "32": "Unknown",

    "40": "Unknown",
    "41": "Balcony",
    "42": "Bathroom",
    "43": "Bedroom",
    "44": "Corridor",
    "45": "Dining Room",
    "46": "Kitchen",
    "47": "Living Room",


    "128": "Pedestal",
    "129": "Bathroom Scale",
    "130": "Power Strip",
    "131": "Unknown",
    "132": "Toy",
    "133": "Shoes",
    "134": "Sock",
    "135": "Feces",
    "136": "Trash Can",
    "137": "Fabric",
    "138": "Cable", // Thread?
    "139": "Stain",
    "140": "Dock Entrance",
    "141": "Dock",
    "142": "Obstacle", // Ambiguous obstacle
    "143": "Black Desk Leg",

    "144": "Roller",
    "145": "Sweeper",
    "146": "Cleaning Robot",

    "147": "Ambiguous Other",
    "148": "Carpet Segment",
    "149": "Ground",
    "150": "Carpet",
    "151": "Unknown",
    "152": "Ceramic",

    "157": "Human",
    "158": "Pet",

    "159": "Furniture Leg",
    "160": "Furniture Leg Black",
    "161": "Wheel",
    "162": "Robot Cleaner",
    "163": "Cleaner",
    "164": "Unknown",
    "165": "Bottle",
    "166": "Unknown",
    "167": "Pet Bowl",
    "168": "Mirror",

    "169": "Stain need filter", //??

    "170": "Hand Gesture Unknown",
    "171": "Hand Gesture Stop",
    // Various body key points I'm not going to document here because they'll certainly only be used within the robots
    // firmware for some kind of gesture control

    "201": "Bar Stool", // Might also be any kind of furniture that can act as a prison for the robot that can be entered but not left
});

/**
 * @typedef {object} AI_SETTINGS
 * @property {boolean} obstacleDetection
 * @property {boolean} petObstacleDetection
 * @property {boolean} obstacleImages
 */

/**
 * @typedef {object} MOP_DOCK_SETTINGS
 * @property {number} padCleaningFrequency
 * @property {number} operationMode
 * @property {number} waterGrade
 */

/**
 * @typedef {object} MISC_TUNABLES
 *
 * @property {number} [AutoDry]
 * @property {number} [CleanType]
 * @property {number} [FillinLight]
 * @property {number} [FluctuationConfirmResult]
 * @property {number} [FluctuationTestResult]
 * @property {number} [HotWash]
 * @property {number} [LessColl] 
 * @property {number} [MaterialDirectionClean]
 * @property {number} [MeticulousTwist]
 * @property {number} [MonitorHumanFollow]
 * @property {number} [MopScalable]
 * @property {number} [PetPartClean]
 * @property {number} [SmartAutoMop]
 * @property {number} [SmartAutoWash]
 * @property {number} [SmartCharge]
 * @property {number} [SmartDrying]
 * @property {number} [SmartHost]
 * @property {number} [StainIdentify]
 * @property {number} [SuctionMax]
 * @property {number} [LacuneMopScalable]
 * @property {number} [MopScalable2]
 * @property {number} [CarpetFineClean]
 * @property {number} [SbrushExtrSwitch]
 * @property {number} [MopExtrSwitch]
 * @property {number} [ExtrFreq]
 * 
 */

module.exports = DreameUtils;
