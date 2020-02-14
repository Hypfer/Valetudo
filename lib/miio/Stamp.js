/**
 * @param options {object}
 * @param [options.val]
 * @constructor
 */
const Stamp = function(options) {
    this.val = options.val;
    this.time = Date.now();
};

Stamp.prototype.isValid = function() {
    return (this.val ? true : false) && (Date.now() - this.time < 120000);
};

module.exports = Stamp;