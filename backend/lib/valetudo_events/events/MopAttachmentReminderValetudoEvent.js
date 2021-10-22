const DismissibleValetudoEvent = require("./DismissibleValetudoEvent");

class MopAttachmentReminderValetudoEvent extends DismissibleValetudoEvent {
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
