const ValetudoEvent = require("./ValetudoEvent");

class MopAttachmentReminderValetudoEvent extends ValetudoEvent {
    /**
     *
     * @param {object}   options
     * @param {object}  [options.metaData]
     * @class
     */
    constructor(options) {
        super(Object.assign({}, options, {id: "mop_attachment_reminder"}));
    }
}

module.exports = MopAttachmentReminderValetudoEvent;
