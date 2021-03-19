const StateAttribute = require("./StateAttribute");


/**
 * This may at some point also provide it's current capacity/fill level
 */

class AttachmentStateAttribute extends StateAttribute {
    /**
     * @param {object} options 
     * @param {AttachmentStateAttributeType} options.type 
     * @param {object} [options.metaData] 
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
    WATERBOX: "waterbox",
    MOP: "mop"
});


module.exports = AttachmentStateAttribute;
