const DismissibleValetudoEvent = require("./DismissibleValetudoEvent");

class MopAttachmentReminderValetudoEvent extends DismissibleValetudoEvent {
    /**
     *
     * @param {object}   options
     * @param {object}  [options.metaData]
     * @class
     */
    constructor(options) {
        super(Object.assign({}, options, {id: MopAttachmentReminderValetudoEvent.ID}));
    }
}

MopAttachmentReminderValetudoEvent.ID = "mop_attachment_reminder";

module.exports = MopAttachmentReminderValetudoEvent;
