
class Stamp {
    /**
     * @param {object} options
     * @param {number=} options.val
     */
    constructor(options) {
        this.val = options.val;
        this.time = Date.now();
    }

    isValid() {
        const stampAge = Date.now() - this.time;
        return this.val && stampAge < 120000;
    }

    /** @returns {Stamp} */
    orNew() {
        return this.isValid() ? this : Stamp.new();
    }

    static new() {
        return new Stamp({val: Math.floor(Date.now() / 1000)});
    }
}

module.exports = Stamp;
