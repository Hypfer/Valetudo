const fs = require("fs");
const LinuxTools = require("../../utils/LinuxTools");
const os = require("os");
const ValetudoUpdaterError = require("./ValetudoUpdaterError");

/**
 * @param {number} spaceRequired
 * 
 * @return {string}
 * @throws {ValetudoUpdaterError}
 */
function getDownloadPath(spaceRequired) {
    let downloadLocation;

    try {
        fs.accessSync(process.argv0, fs.constants.W_OK);
    } catch (e) {
        throw new ValetudoUpdaterError(
            ValetudoUpdaterError.ERROR_TYPE.NOT_WRITABLE,
            `Updating is impossible because binary location "${process.argv0}" is not writable.`
        );
    }

    const spaceBinaryLocation = LinuxTools.GET_DISK_SPACE_INFO(process.argv0);

    if (spaceBinaryLocation === null) {
        throw new ValetudoUpdaterError(
            ValetudoUpdaterError.ERROR_TYPE.NOT_ENOUGH_SPACE,
            `Unable to determine the free space of ${process.argv0}.`
        );
    } else if (spaceBinaryLocation.free < spaceRequired) {
        throw new ValetudoUpdaterError(
            ValetudoUpdaterError.ERROR_TYPE.NOT_ENOUGH_SPACE,
            `Updating is impossible because there's not enough space to store the new binary at ${process.argv0}.` + "\n" +
            `Required: ${spaceRequired} bytes. Available: ${spaceBinaryLocation.free} bytes.`
        );
    }

    const tmpPath = os.tmpdir();
    const spaceTmp = LinuxTools.GET_DISK_SPACE_INFO(tmpPath);

    if (spaceTmp === null) {
        throw new ValetudoUpdaterError(
            ValetudoUpdaterError.ERROR_TYPE.NOT_ENOUGH_SPACE,
            `Unable to determine the free space of ${tmpPath}.`
        );
    } else if (spaceTmp.free < spaceRequired) {
        const shmPath = "/dev/shm";
        const spaceShm = LinuxTools.GET_DISK_SPACE_INFO(shmPath);

        if (spaceShm === null) {
            throw new ValetudoUpdaterError(
                ValetudoUpdaterError.ERROR_TYPE.NOT_ENOUGH_SPACE,
                `Unable to determine the free space of ${shmPath}.`
            );
        } else if (spaceShm.free < spaceRequired) {
            throw new ValetudoUpdaterError(
                ValetudoUpdaterError.ERROR_TYPE.NOT_ENOUGH_SPACE,
                `
                Updating is impossible because there's no download location with enough free space available.
                Required: ${spaceRequired} bytes. 
                
                ${tmpPath} only has ${spaceTmp.free} bytes of free space. 
                ${shmPath} only has ${spaceShm.free} bytes of free space.
                `
            );
        } else {
            downloadLocation = shmPath;
        }
    } else {
        downloadLocation = tmpPath;
    }

    try {
        fs.accessSync(downloadLocation, fs.constants.W_OK);
    } catch (e) {
        throw new ValetudoUpdaterError(
            ValetudoUpdaterError.ERROR_TYPE.NOT_WRITABLE,
            `Updating is impossible because download location "${downloadLocation}" is not writable.`
        );
    }

    return downloadLocation;
}

/**
 * 
 * @param {Array<import("./update_provider/ValetudoRelease")>} releases
 * @param {string} currentVersion
 * 
 * @return {{release: import("./update_provider/ValetudoRelease"), updateRequired: boolean}}
 * @throws {ValetudoUpdaterError}
 */
function determineReleaseToDownload(releases, currentVersion) {
    if (releases.length === 0) {
        throw new ValetudoUpdaterError(
            ValetudoUpdaterError.ERROR_TYPE.NO_RELEASE,
            "No release found"
        );
    }

    const releaseVersions = releases.map(r => {
        return r.version;
    });
    const currentVersionIndex = releaseVersions.indexOf(currentVersion);

    if (currentVersionIndex === -1) { //Default to the latest release
        return {
            release: releases[0],
            updateRequired: true
        };
    } else if (currentVersionIndex > 0) { //Always try to pick the next chronological release if possible
        return {
            release: releases[currentVersionIndex-1],
            updateRequired: true
        };
    } else { //We're already on the latest release
        return {
            release: releases[0],
            updateRequired: false
        };
    }
}

module.exports = {
    getDownloadPath: getDownloadPath,
    determineReleaseToDownload: determineReleaseToDownload
};
