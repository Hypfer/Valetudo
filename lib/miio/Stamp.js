/**
 * @param options {object}
 * @param options.val {number=}
 * @constructor
 */
const Stamp = function(options) {
    this.val = options.val;
    this.time = Date.now();
};

Stamp.prototype.isValid = function() {
    const stampAge = Date.now() - this.time;
    return this.val && stampAge < 120000;
};

/** @returns {Stamp} */
Stamp.prototype.orNew = function() {
    return this.isValid() ? this : Stamp.new();
};

Stamp.new = function() {
    return new Stamp({val: Math.floor(Date.now() / 1000)});
};

module.exports = Stamp;