class Model {
    /**
     * @param {string} identifier
     */
    constructor(identifier) {
        this.identifier = identifier;

        let parsedName = this.identifier.match(DEVICE_REGEX);
        if (Array.isArray(parsedName) && parsedName.length === 4) {
            this.manufacturer = parsedName[1];
            this.modelIdentifier = parsedName[3];
        }
    }

    /**
     * Returns capabilities that differ by model.
     * @public
     */
    getCapabilities() {
        return {"persistent_data": this.identifier === "roborock.vacuum.s5"};
    }

    /**
     * Returns the manufacturer of the robot
     * @public
     * @returns {string}
     */
    getManufacturerName() {
        return VACUUM_MANUFACTURERS[this.manufacturer] || UNKNOWN;
    }

    /**
     * @public
     * @returns {string}
     */
    getModelName() {
        if (this.manufacturer && MODELS[this.manufacturer]) {
            return MODELS[this.manufacturer][this.modelIdentifier] || UNKNOWN;
        } else {
            return UNKNOWN;
        }
    }

    /**
     * @public
     * @returns {string}
     */
    getModelIdentifier() {
        return this.identifier;
    }
}


const DEVICE_REGEX = /^([a-z]*)\.([a-z]*)\.([a-z0-9]*)$/;
const VACUUM_MANUFACTURERS = {
    "viomi": "Viomi Technology Co., Ltd",
    "roborock": "Beijing Roborock Technology Co., Ltd.",
    "rockrobo": "Beijing Roborock Technology Co., Ltd." //🙄
};
const MODELS = {
    "viomi": {
        "v7": "Xiaomi Mijia STYJ02YM"
    },
    "roborock": {
        "s5": "S5"
    },
    "rockrobo": {
        "v1": "Xiaomi Mi SDJQR02RR"
    }
};
const UNKNOWN = "Unknown";

module.exports = Model;
