const NotImplementedError = require("../../../core/NotImplementedError");
const Tools = require("../../../utils/Tools");

class ValetudoUpdateProvider {
    constructor() {
        //intentional
    }

    /**
     * This allows checking for updates based on either the valetudo version, the commit id or something else entirely
     * @return {string}
     */
    getCurrentVersion() {
        return Tools.GET_VALETUDO_VERSION();
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
