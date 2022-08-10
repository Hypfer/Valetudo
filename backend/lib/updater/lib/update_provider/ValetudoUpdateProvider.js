const NotImplementedError = require("../../../core/NotImplementedError");

class ValetudoUpdateProvider {
    constructor() {
        //intentional
    }

    /**
     * @abstract
     * @return {Promise<Array<import("./ValetudoRelease")>>} These have to be sorted by release date. Element 0 should be the most recent one
     */
    async fetchReleases() {
        throw new NotImplementedError();
    }

    /**
     * @abstract
     * @param {import("./ValetudoRelease")} release
     * @return {Promise<Array<import("./ValetudoReleaseBinary")>>}
     */
    async fetchBinariesForRelease(release) {
        throw new NotImplementedError();
    }
}

module.exports = ValetudoUpdateProvider;
