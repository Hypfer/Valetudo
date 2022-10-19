const fs = require("fs");
const LinuxTools = require("../../utils/LinuxTools");
const os = require("os");
const ValetudoUpdaterError = require("./ValetudoUpdaterError");

const SPACE_REQUIRED_REGULAR = 40 * 1024 * 1024;
const SPACE_REQUIRED_UPX = 20 * 1024 * 1024;

/**
 *
 * @returns {{requiresUPX: boolean, downloadPath: string}}
 * @throws {ValetudoUpdaterError}
 */
function storageSurvey() {
    const tmpPath = os.tmpdir();
    const shmPath = "/dev/shm";
    let requiresUPX = false;
    let spaceRequired;
    let downloadPath;

    try {
        fs.accessSync(process.argv0, fs.constants.W_OK);
    } catch (e) {
        throw new ValetudoUpdaterError(
            ValetudoUpdaterError.ERROR_TYPE.NOT_WRITABLE,
            `Updating is impossible because binary location "${process.argv0}" is not writable.`
        );
    }


    const spaceBinaryLocation = LinuxTools.GET_DISK_SPACE_INFO(process.argv0);
    const spaceTmp = LinuxTools.GET_DISK_SPACE_INFO(tmpPath);
    const spaceShm = LinuxTools.GET_DISK_SPACE_INFO(shmPath);

    if (spaceBinaryLocation === null) {
        throw new ValetudoUpdaterError(
            ValetudoUpdaterError.ERROR_TYPE.NOT_ENOUGH_SPACE,
            `Unable to determine the free space of ${process.argv0}.`
        );
    }

    if (spaceTmp === null && spaceShm === null) {
        throw new ValetudoUpdaterError(
            ValetudoUpdaterError.ERROR_TYPE.NOT_ENOUGH_SPACE,
            `Unable to determine the free space of both ${tmpPath} and ${shmPath}.`
        );
    }


    if (spaceBinaryLocation.free > SPACE_REQUIRED_REGULAR) {
        requiresUPX = false;
        spaceRequired = SPACE_REQUIRED_REGULAR;
    } else if (spaceBinaryLocation.free > SPACE_REQUIRED_UPX) {
        requiresUPX = true;
        spaceRequired = SPACE_REQUIRED_UPX;
    } else {
        throw new ValetudoUpdaterError(
            ValetudoUpdaterError.ERROR_TYPE.NOT_ENOUGH_SPACE,
            `Updating is impossible because there's not enough space to store the new binary at ${process.argv0}.` + "\n" +
            `Required: at least ${SPACE_REQUIRED_UPX} bytes. Available: ${spaceBinaryLocation.free} bytes.`
        );
    }

    // Always use UPX if Valetudo is stored on a small storage
    if (spaceBinaryLocation.total < SPACE_REQUIRED_REGULAR * 3) {
        requiresUPX = true;
        spaceRequired = SPACE_REQUIRED_UPX;
    }


    if (spaceTmp?.free > spaceRequired) {
        downloadPath = tmpPath;
    } else if (spaceShm?.free > spaceRequired) {
        downloadPath = shmPath;
    } else if (requiresUPX !== true) {
        // Maybe UPX can help with download locations that are too small?
        requiresUPX = true;
        spaceRequired = SPACE_REQUIRED_UPX;

        if (spaceTmp?.free > spaceRequired) {
            downloadPath = tmpPath;
        } else if (spaceShm?.free > spaceRequired) {
            downloadPath = shmPath;
        }
    }


    if (!downloadPath) {
        throw new ValetudoUpdaterError(
            ValetudoUpdaterError.ERROR_TYPE.NOT_ENOUGH_SPACE,
            `
                Updating is impossible because there's no download location with enough free space available.
                Required: ${spaceRequired} bytes. 
                
                ${tmpPath} only has ${spaceTmp.free} bytes of free space. 
                ${shmPath} only has ${spaceShm.free} bytes of free space.
                `
        );
    }

    try {
        fs.accessSync(downloadPath, fs.constants.W_OK);
    } catch (e) {
        throw new ValetudoUpdaterError(
            ValetudoUpdaterError.ERROR_TYPE.NOT_WRITABLE,
            `Updating is impossible because download location "${downloadPath}" is not writable.`
        );
    }


    return {
        requiresUPX: requiresUPX,
        downloadPath: downloadPath
    };
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
    storageSurvey: storageSurvey,
    determineReleaseToDownload: determineReleaseToDownload
};
