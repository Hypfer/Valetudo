const StateAttribute = require("./StateAttribute");

/**
 * This may at some point also provide it's current capacity/fill level
 */

class AttachmentStateAttribute extends StateAttribute {
    /**
     * @param {object} options
     * @param {AttachmentStateAttributeType} options.type
     * @param {boolean} options.attached
     * @param {object} [options.metaData]
     */
    constructor(options) {
        super(options);

        this.type = options.type;
        this.attached = options.attached;
    }
}

/**
 *  @typedef {string} AttachmentStateAttributeType
 *  @enum {string}
 *
 */
AttachmentStateAttribute.TYPE = Object.freeze({
    DUSTBIN: "dustbin",
    WATERTANK: "watertank",
    MOP: "mop"
});


module.exports = AttachmentStateAttribute;
