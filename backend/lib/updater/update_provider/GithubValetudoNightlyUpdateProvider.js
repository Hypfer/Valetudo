const ValetudoRelease = require("./ValetudoRelease");
const ValetudoReleaseBinary = require("./ValetudoReleaseBinary");
const ValetudoUpdateProvider = require("./ValetudoUpdateProvider");
const {default: axios} = require("axios");

class GithubValetudoNightlyUpdateProvider extends ValetudoUpdateProvider {

    /**
     * @return {Promise<Array<import("./ValetudoRelease")>>}
     */
    async fetchReleases() {
        let rawBranchResponse = await axios.get(GithubValetudoNightlyUpdateProvider.REPO_URL);

        if (
            !(
                rawBranchResponse?.data?.commit?.sha &&
                rawBranchResponse.data.commit.commit?.committer?.date &&
                rawBranchResponse.data.commit.commit.message
            )
        ) {
            throw new Error("GithubValetudoNightlyUpdateProvider: Received invalid branch response");
        }

        return [
            new ValetudoRelease({
                version: rawBranchResponse.data.commit.sha,
                releaseTimestamp: new Date(rawBranchResponse.data.commit.commit.committer.date),
                changelog: rawBranchResponse.data.commit.commit.message,
            })
        ];
    }

    /**
     * @param {import("./ValetudoRelease")} release
     * @return {Promise<Array<import("./ValetudoReleaseBinary")>>}
     */
    async fetchBinariesForRelease(release) {
        let releaseBinaries = [];
        let rawManifestResponse = await axios.get(`${GithubValetudoNightlyUpdateProvider.ASSET_BASE_URL}${GithubValetudoNightlyUpdateProvider.MANIFEST_NAME}`);

        // @ts-ignore
        if (!rawManifestResponse.data) {
            throw new Error(`GithubValetudoNightlyUpdateProvider: Invalid ${GithubValetudoNightlyUpdateProvider.MANIFEST_NAME}`);
        }

        const manifest = rawManifestResponse.data;

        // @ts-ignore
        releaseBinaries = Object.keys(manifest.sha256sums).map(name => {
            return new ValetudoReleaseBinary({
                name: name,
                // @ts-ignore
                sha256sum: manifest.sha256sums[name] ?? "", //This will cause any install to fail but at least it's somewhat valid
                downloadUrl: `${GithubValetudoNightlyUpdateProvider.ASSET_BASE_URL}${GithubValetudoNightlyUpdateProvider.BINARY_NAMES[name]}`
            });
        });

        return releaseBinaries;
    }
}


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
