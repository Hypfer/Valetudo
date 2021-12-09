const ValetudoRelease = require("./ValetudoRelease");
const ValetudoReleaseBinary = require("./ValetudoReleaseBinary");
const ValetudoUpdateProvider = require("./ValetudoUpdateProvider");
const {default: axios} = require("axios");

class GithubValetudoUpdateProvider extends ValetudoUpdateProvider {

    /**
     * @return {Promise<Array<import("./ValetudoRelease")>>}
     */
    async fetchReleases() {
        let rawReleasesResponse = await axios.get(GithubValetudoUpdateProvider.RELEASES_URL);
        let releases = [];

        if (!Array.isArray(rawReleasesResponse?.data)) {
            throw new Error("GithubValetudoUpdateProvider: Received invalid releases response");
        }

        releases = rawReleasesResponse.data.filter(rR => {
            return rR.prerelease === false && rR.draft === false;
        }).map(rR => {
            return new ValetudoRelease({
                version: rR.tag_name,
                releaseTimestamp: new Date(rR.published_at),
                changelog: rR.body,
                metaData: {
                    githubReleaseUrl: rR.url
                }
            });
        });

        releases.sort((a, b) => {
            return b.releaseTimestamp.getTime() - a.releaseTimestamp.getTime();
        });

        return releases;
    }

    /**
     * @param {import("./ValetudoRelease")} release
     * @return {Promise<Array<import("./ValetudoReleaseBinary")>>}
     */
    async fetchBinariesForRelease(release) {
        if (!release.metaData.githubReleaseUrl) {
            throw new Error("Missing Github Release URL in Release Metadata");
        }

        let rawReleaseResponse = await axios.get(release.metaData.githubReleaseUrl);
        let releaseBinaries = [];




        // @ts-ignore
        if (!Array.isArray(rawReleaseResponse?.data?.assets)) {
            throw new Error("GithubValetudoUpdateProvider: Received invalid release response");
        }

        // @ts-ignore
        let manifestAsset = rawReleaseResponse.data.assets.find(a => {
            return a.name === GithubValetudoUpdateProvider.MANIFEST_NAME;
        });

        if (!manifestAsset) {
            throw new Error(`GithubValetudoUpdateProvider: Missing ${GithubValetudoUpdateProvider.MANIFEST_NAME}`);
        }

        let rawManifestResponse = await axios.get(manifestAsset.browser_download_url);

        // @ts-ignore
        if (!rawManifestResponse.data || rawManifestResponse.data.version !== release.version) {
            throw new Error(`GithubValetudoUpdateProvider: Invalid ${GithubValetudoUpdateProvider.MANIFEST_NAME}`);
        }

        const manifest = rawManifestResponse.data;

        // @ts-ignore
        releaseBinaries = rawReleaseResponse.data.assets.filter(a => {
            return a.name !== GithubValetudoUpdateProvider.MANIFEST_NAME;
        }).map(a => {
            return new ValetudoReleaseBinary({
                name: a.name,
                // @ts-ignore
                sha256sum: manifest.sha256sums[a.name] ?? "", //This will cause any install to fail but at least it's somewhat valid
                downloadUrl: a.browser_download_url
            });
        });

        return releaseBinaries;
    }
}


GithubValetudoUpdateProvider.RELEASES_URL = "https://api.github.com/repos/Hypfer/Valetudo/releases";
GithubValetudoUpdateProvider.MANIFEST_NAME = "valetudo_release_manifest.json";


module.exports = GithubValetudoUpdateProvider;
