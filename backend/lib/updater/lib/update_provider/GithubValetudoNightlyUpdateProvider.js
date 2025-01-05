const Tools = require("../../../utils/Tools");
const ValetudoRelease = require("./ValetudoRelease");
const ValetudoReleaseBinary = require("./ValetudoReleaseBinary");
const ValetudoUpdateProvider = require("./ValetudoUpdateProvider");
const {get} = require("../UpdaterUtils");

class GithubValetudoNightlyUpdateProvider extends ValetudoUpdateProvider {
    getCurrentVersion() {
        return Tools.GET_COMMIT_ID();
    }

    /**
     * @return {Promise<Array<import("./ValetudoRelease")>>}
     */
    async fetchReleases() {
        let rawBranchResponse = await get(GithubValetudoNightlyUpdateProvider.REPO_URL);

        if (
            !(
                rawBranchResponse?.data?.commit?.sha &&
                rawBranchResponse.data.commit.commit?.committer?.date &&
                rawBranchResponse.data.commit.commit.message
            )
        ) {
            throw new Error("GithubValetudoNightlyUpdateProvider: Received invalid branch response");
        }

        let changelog = rawBranchResponse.data.commit.commit.message;
        let version = rawBranchResponse.data.commit.sha;
        let manifest;

        try {
            manifest = await this.fetchManifest();

            if (typeof manifest?.changelog === "string") {
                changelog = manifest.changelog;
            }
            if (typeof manifest?.version === "string") {
                version = manifest.version;
            }
        } catch (e) {
            // intentional
        }

        return [
            new ValetudoRelease({
                version: version,
                releaseTimestamp: new Date(rawBranchResponse.data.commit.commit.committer.date),
                changelog: changelog,
            })
        ];
    }

    /**
     * @param {import("./ValetudoRelease")} release
     * @return {Promise<Array<import("./ValetudoReleaseBinary")>>}
     */
    async fetchBinariesForRelease(release) {
        const manifest = await this.fetchManifest();

        // @ts-ignore
        return Object.keys(manifest.sha256sums).map(name => {
            return new ValetudoReleaseBinary({
                name: name,
                // @ts-ignore
                sha256sum: manifest.sha256sums[name] ?? "", //This will cause any install to fail but at least it's somewhat valid
                downloadUrl: `${GithubValetudoNightlyUpdateProvider.ASSET_BASE_URL}${GithubValetudoNightlyUpdateProvider.BINARY_NAMES[name]}`
            });
        });
    }


    /**
     * @private
     * @return {Promise<any>}
     */
    async fetchManifest() {
        let rawManifestResponse = await get(`${GithubValetudoNightlyUpdateProvider.ASSET_BASE_URL}${GithubValetudoNightlyUpdateProvider.MANIFEST_NAME}`);

        // @ts-ignore
        if (!rawManifestResponse.data) {
            throw new Error(`GithubValetudoNightlyUpdateProvider: Invalid ${GithubValetudoNightlyUpdateProvider.MANIFEST_NAME}`);
        }

        return rawManifestResponse.data;
    }
}


GithubValetudoNightlyUpdateProvider.TYPE = "github_nightly";

GithubValetudoNightlyUpdateProvider.REPO_URL = "https://api.github.com/repos/Hypfer/valetudo-nightly-builds/branches/master";
GithubValetudoNightlyUpdateProvider.ASSET_BASE_URL = "https://raw.githubusercontent.com/Hypfer/valetudo-nightly-builds/master/";
GithubValetudoNightlyUpdateProvider.MANIFEST_NAME = "valetudo_release_manifest.json";

GithubValetudoNightlyUpdateProvider.BINARY_NAMES = {
    "valetudo-armv7": "armv7/valetudo",
    "valetudo-armv7-lowmem": "armv7/valetudo-lowmem",
    "valetudo-aarch64": "aarch64/valetudo",

    "valetudo-armv7.upx": "armv7/valetudo.upx",
    "valetudo-armv7-lowmem.upx": "armv7/valetudo-lowmem.upx",
    "valetudo-aarch64.upx": "aarch64/valetudo.upx",
};


module.exports = GithubValetudoNightlyUpdateProvider;
