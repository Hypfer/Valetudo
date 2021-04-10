const HassAnchorSubscriber = require("./HassAnchorSubscriber");

class CallbackHassAnchorSubscriber extends HassAnchorSubscriber {
    /**
     * @callback cb
     * @param {import("./HassAnchor")} anchor
     * @return {Promise<void>}
     */
    /**
     * @param {cb} callback
     */
    constructor(callback) {
        super();
        this.callback = callback;
    }

    async onAnchorPost(anchor) {
        await this.callback(anchor);
    }
}

module.exports = CallbackHassAnchorSubscriber;
