
// It seems that everything the AI models can detect shares the same ID space
const AI_CLASSIFIER_IDS = Object.freeze({
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

const WATER_HOOKUP_ERRORS = Object.freeze({
    1: "Tank replacements not installed",
    2: "External control box not installed",
    3: "Freshwater input abnormal. Check anything affecting water pressure",
    4: "Wastewater output abnormal. Check the pump",
    5: "Wastewater output abnormal. Check the filter"
});

module.exports = {
    WATER_HOOKUP_ERRORS: WATER_HOOKUP_ERRORS,
    AI_CLASSIFIER_IDS: AI_CLASSIFIER_IDS
};
