const ValetudoUpdateProvider = require("./ValetudoUpdateProvider");

class NullUpdateProvider extends ValetudoUpdateProvider {
    /**
     * @return {Promise<Array<import("./ValetudoRelease")>>}
     */
    async fetchReleases() {
        return [];
    }

    /**
     * @param {import("./ValetudoRelease")} release
     * @return {Promise<Array<import("./ValetudoReleaseBinary")>>}
     */
    async fetchBinariesForRelease(release) {
        return [];
    }
}

module.exports = NullUpdateProvider;
