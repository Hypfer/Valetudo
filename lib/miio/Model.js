/**
 * @param {string} name
 * @constructor
 */
const Model = function(name) {
    this.viomiApi = name == "viomi.vacuum.v7";
    this.name = name;
};

/**
 * Returns capabilities that differ by model.
 */
Model.prototype.getCapabilities = function() {
    return {"persistent_data": this.name == "roborock.vacuum.s5"};
};

module.exports = Model;
