const NotImplementedError = require("../../core/NotImplementedError");

/**
 * @abstract
 * @public
 */
class HassAnchorSubscriber {
    /**
     * @package
     * @abstract
     * @param {import("./HassAnchor")} anchor
     * @return {Promise<void>}
     */
    async onAnchorPost(anchor) {
        throw new NotImplementedError();
    }
}

module.exports = HassAnchorSubscriber;
