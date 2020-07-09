const StateAttribute = require("./StateAttribute");


/**
 * This may at some point also provide it's current capacity/fill level
 */

class AttachmentStateAttribute extends StateAttribute {
    /**
     * @param options {object}
     * @param options.type {AttachmentStateAttributeType}
     * @param [options.metaData] {object}
     */
    constructor(options) {
        super(options);

        this.type = options.type;
    }
}

/**
 *  @typedef {string} AttachmentStateAttributeType
 *  @enum {string}
 *
 */
AttachmentStateAttribute.TYPE = Object.freeze({
    DUSTBIN: "dustbin",
    WATERBOX: "waterbox"
});


module.exports = AttachmentStateAttribute;