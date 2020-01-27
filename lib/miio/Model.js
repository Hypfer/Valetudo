/**
 * @param {string} name
 * @constructor
 */
const Model = function(name) {
    this.viomiApi = name == "viomi.vacuum.v7";
    this.name = name;
};

module.exports = Model;
