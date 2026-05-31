const assert = require("node:assert");
const { describe, it } = require("node:test");

const UpdaterUtils = require("../../../../lib/updater/lib/UpdaterUtils");
const ValetudoRelease = require("../../../../lib/updater/lib/update_provider/ValetudoRelease");

describe("UpdaterUtils", () => {

    it("does not offer an update when up to date", () => {
        const releases = [
            new ValetudoRelease({
                version: "3",
                releaseTimestamp: new Date(),
                changelog: ""
            }),
            new ValetudoRelease({
                version: "2",
                releaseTimestamp: new Date(),
                changelog: ""
            }),
            new ValetudoRelease({
                version: "1",
                releaseTimestamp: new Date(),
                changelog: ""
            })
        ];
        const result = UpdaterUtils.determineReleaseToDownload(
            releases,
            "3"
        );

        assert.deepStrictEqual(result, {
            release: releases[0],
            updateRequired: false
        });
    });

    it("offers update to latest when running an unknown version", () => {
        const releases = [
            new ValetudoRelease({
                version: "3",
                releaseTimestamp: new Date(),
                changelog: ""
            }),
            new ValetudoRelease({
                version: "2",
                releaseTimestamp: new Date(),
                changelog: ""
            }),
            new ValetudoRelease({
                version: "1",
                releaseTimestamp: new Date(),
                changelog: ""
            })
        ];
        const result = UpdaterUtils.determineReleaseToDownload(
            releases,
            "0"
        );

        assert.deepStrictEqual(result, {
            release: releases[0],
            updateRequired: true
        });
    });

    it("offers update to next chronological release", () => {
        const releases = [
            new ValetudoRelease({
                version: "3",
                releaseTimestamp: new Date(),
                changelog: ""
            }),
            new ValetudoRelease({
                version: "2",
                releaseTimestamp: new Date(),
                changelog: ""
            }),
            new ValetudoRelease({
                version: "1",
                releaseTimestamp: new Date(),
                changelog: ""
            })
        ];
        const result = UpdaterUtils.determineReleaseToDownload(
            releases,
            "1"
        );

        assert.deepStrictEqual(result, {
            release: releases[1],
            updateRequired: true
        });
    });

    it("forces update when already on latest version", () => {
        const releases = [
            new ValetudoRelease({
                version: "3",
                releaseTimestamp: new Date(),
                changelog: ""
            }),
            new ValetudoRelease({
                version: "2",
                releaseTimestamp: new Date(),
                changelog: ""
            }),
            new ValetudoRelease({
                version: "1",
                releaseTimestamp: new Date(),
                changelog: ""
            })
        ];
        const result = UpdaterUtils.determineReleaseToDownload(
            releases,
            "3",
            true
        );

        assert.deepStrictEqual(result, {
            release: releases[0],
            updateRequired: true
        });
    });
});
