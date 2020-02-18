class Model {
    /**
     * @param {string} name
     * @constructor
     */
    constructor(name) {
        this.viomiApi = name == "viomi.vacuum.v7";
        this.RoborockApi = name == "roborock.vacuum.s5";
        this.name = name;
    }

    /**
     * Returns capabilities that differ by model.
     */
    getCapabilities() {
        return {"persistent_data": this.RoborockApi};
    }
}

module.exports = Model;
