// @ts-nocheck Required due to too many annoyances

const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path/posix");
const spawnSync = require("child_process").spawnSync;
const {pipeline} = require("stream/promises");


const axios = require("axios").default;
const uuid = require("uuid");

const GithubValetudoUpdateProvider = require("./update_provider/GithubValetudoUpdateProvider");
const Logger = require("../Logger");
const stateAttrs = require("../entities/state/attributes");
const States = require("../entities/core/updater");
const Tools = require("../Tools");



class Updater {
    /**
     * @param {object} options
     * @param {import("../Configuration")} options.config
     * @param {import("../core/ValetudoRobot")} options.robot
     */
    constructor(options) {
        this.config = options.config;
        this.robot = options.robot;

        this.updaterConfig = this.config.get("updater");

        this.state = undefined;
        this.updateProvider = undefined;

        if (this.updaterConfig.enabled === true) {
            this.state = new States.ValetudoUpdaterIdleState({
                currentVersion: Tools.GET_VALETUDO_VERSION()
            });
        } else {
            this.state = new States.ValetudoUpdaterDisabledState({});
        }


        switch (this.updaterConfig.updateProvider.type) {
            case "github":
                this.updateProvider = new GithubValetudoUpdateProvider();
                break;
            default:
                throw new Error(`Invalid UpdateProvider ${this.updaterConfig.updateProvider.type}`);
        }
    }

    /**
     * As everything regarding networking might take a long time, we just accept this request
     * and then asynchronously process it.
     * Updates are reported via the updaters state
     *
     * @return {boolean}
     */
    triggerCheck() {
        if (
            !(
                this.state instanceof States.ValetudoUpdaterIdleState ||
                this.state instanceof States.ValetudoUpdaterErrorState ||
                this.state instanceof States.ValetudoUpdaterNoUpdateRequiredState
            )
        ) {
            throw new Error("Updates can only be started when the updaters state is idle or error");
        }


        this.state.busy = true;
        this.check().catch(err => {
            //This should never happen
            Logger.error("Unexpected error during check", err);
        });

        return true;
    }

    triggerDownload() {
        if (!(this.state instanceof States.ValetudoUpdaterApprovalPendingState)) {
            throw new Error("Downloads can only be started when there's pending approval");
        }

        this.state.busy = true;
        this.download().catch(err => {
            //This should never happen
            Logger.error("Unexpected error during download", err);
        });

        return true;
    }

    triggerApply() {
        if (!(this.state instanceof States.ValetudoUpdaterApplyPendingState)) {
            throw new Error("Can only apply if there's finalization pending");
        }

        this.state.busy = true;
        this.apply().catch(err => {
            //This should never happen
            Logger.error("Unexpected error during apply", err);
        });

        return true;
    }

    async apply() {
        const applyPendingState = this.state;

        fs.unlinkSync(process.argv0);
        fs.copyFileSync(applyPendingState.downloadPath, process.argv0);
        fs.chmodSync(process.argv0, fs.constants.S_IXUSR | fs.constants.S_IXGRP | fs.constants.S_IXOTH);
        fs.unlinkSync(applyPendingState.downloadPath);

        spawnSync("sync");
        spawnSync("reboot");
    }

    async download() {
        const approvalState = this.state;
        const downloadingState = new States.ValetudoUpdaterDownloadingState({
            version: approvalState.version,
            releaseTimestamp: approvalState.releaseTimestamp,
            downloadUrl: approvalState.downloadUrl,
            expectedHash: approvalState.expectedHash,
            downloadPath: approvalState.downloadPath
        });

        this.state = downloadingState;

        try {
            const downloadResponse = await axios.get(downloadingState.downloadUrl, {responseType: "stream"});
            await pipeline(
                downloadResponse.data,
                fs.createWriteStream(downloadingState.downloadPath)
            );
        } catch (e) {
            Logger.error("Error while downloading release binary", e);

            this.state = new States.ValetudoUpdaterErrorState({
                type: States.ValetudoUpdaterErrorState.ERROR_TYPE.DOWNLOAD_FAILED,
                message: "Error while downloading release binary"
            });

            return;
        }

        let checksum;

        try {
            checksum = await new Promise((resolve, reject) => {
                const hash = crypto.createHash("sha256");
                const readStream = fs.createReadStream(downloadingState.downloadPath);

                readStream.on("error", err => {
                    reject(err);
                });

                readStream.on("data", data => {
                    hash.update(data);
                });

                readStream.on("end", () => {
                    resolve(hash.digest("hex"));
                });
            });
        } catch (e) {
            Logger.error("Error while calculating downloaded binary checksum", e);

            this.state = new States.ValetudoUpdaterErrorState({
                type: States.ValetudoUpdaterErrorState.ERROR_TYPE.UNKNOWN,
                message: "Error while calculating downloaded binary checksum"
            });
        }

        if (checksum !== downloadingState.expectedHash) {
            this.state = new States.ValetudoUpdaterErrorState({
                type: States.ValetudoUpdaterErrorState.ERROR_TYPE.INVALID_CHECKSUM,
                message: `Expected Checksum: ${downloadingState.expectedHash}. Actual: ${checksum}`
            });
        } else {
            this.state = new States.ValetudoUpdaterApplyPendingState({
                version: downloadingState.version,
                releaseTimestamp: downloadingState.releaseTimestamp,
                downloadPath: downloadingState.downloadPath
            });

            setTimeout(() => {
                Logger.warn("Updater: User confirmation timeout.");
                fs.unlinkSync(downloadingState.downloadPath);

                this.state = new States.ValetudoUpdaterIdleState({
                    currentVersion: Tools.GET_VALETUDO_VERSION()
                });

            }, 10 * 60 * 1000);
        }

    }


    /**
     *
     * @private
     */
    async check() {
        const lowmemRequired = Tools.IS_LOWMEM_HOST();
        const archRequired = Updater.ARCHITECTURES[process.arch];
        const currentVersion = Tools.GET_VALETUDO_VERSION();
        let binaryRequired = `valetudo-${archRequired}${lowmemRequired ? "-lowmem" : ""}${Tools.IS_UPX_COMPRESSED(process.argv0) ? ".upx" : ""}`;

        if (this.config.get("embedded") !== true) {
            this.state = new States.ValetudoUpdaterErrorState({
                type: States.ValetudoUpdaterErrorState.ERROR_TYPE.NOT_EMBEDDED,
                message: "Updating is only possible in embedded mode"
            });

            return;
        }

        try {
            await this.robot.pollState();
        } catch (e) {
            this.state = new States.ValetudoUpdaterErrorState({
                type: States.ValetudoUpdaterErrorState.ERROR_TYPE.UNKNOWN,
                message: "Error while polling the robots state"
            });
        }

        const statusAttribute = this.robot.state.getFirstMatchingAttributeByConstructor(
            stateAttrs.StatusStateAttribute
        );

        if (!(statusAttribute && statusAttribute.value === stateAttrs.StatusStateAttribute.VALUE.DOCKED)) {
            this.state = new States.ValetudoUpdaterErrorState({
                type: States.ValetudoUpdaterErrorState.ERROR_TYPE.NOT_DOCKED,
                message: "Updating is only possible while the robot is docked"
            });

            return;
        }


        const downloadPath = this.getDownloadPath();

        if (!downloadPath) { //This works because getDownloadPath already set the correct current state
            return;
        }

        let releases;
        try {
            releases = await this.updateProvider.fetchReleases();
        } catch (e) {
            Logger.error("Error while fetching releases", e);

            this.state = new States.ValetudoUpdaterErrorState({
                type: States.ValetudoUpdaterErrorState.ERROR_TYPE.DOWNLOAD_FAILED,
                message: "Error while fetching releases"
            });

            return;
        }


        const releaseVersions = releases.map(r => {
            return r.version;
        });
        const currentVersionIndex = releaseVersions.indexOf(currentVersion);
        let releaseToDownload;


        if (currentVersionIndex === -1) { //Default to the latest release
            releaseToDownload = releases[0];
        } else if (currentVersionIndex > 0) { //Always try to pick the next chronological release if possible
            releaseToDownload = releases[currentVersionIndex-1];
        } else { //We're already on the latest release
            let changelog;

            if (releases[0] && releases[0].version === currentVersion && releases[0].changelog) {
                changelog = releases[0].changelog;
            }

            this.state = new States.ValetudoUpdaterNoUpdateRequiredState({
                currentVersion: currentVersion,
                changelog: changelog
            });

            return;
        }

        if (!releaseToDownload) {
            this.state = new States.ValetudoUpdaterErrorState({
                type: States.ValetudoUpdaterErrorState.ERROR_TYPE.NO_RELEASE,
                message: "No release found"
            });

            return;
        }

        let releaseBinaries;
        try {
            releaseBinaries = await this.updateProvider.fetchBinariesForRelease(releaseToDownload);
        } catch (e) {
            Logger.error(`Error while fetching release binaries for ${releaseToDownload.version}`, e);

            this.state = new States.ValetudoUpdaterErrorState({
                type: States.ValetudoUpdaterErrorState.ERROR_TYPE.DOWNLOAD_FAILED,
                message: `Error while fetching release binaries for ${releaseToDownload.version}`
            });

            return;
        }

        const binaryToUse = releaseBinaries.find(b => {
            return b.name === binaryRequired;
        });

        if (!binaryToUse) {
            this.state = new States.ValetudoUpdaterErrorState({
                type: States.ValetudoUpdaterErrorState.ERROR_TYPE.NO_MATCHING_BINARY,
                message: `Release ${releaseToDownload.version} doesn't feature a ${binaryRequired} binary.`
            });

            return;
        }

        this.state = new States.ValetudoUpdaterApprovalPendingState({
            version: releaseToDownload.version,
            releaseTimestamp: releaseToDownload.releaseTimestamp,
            changelog: releaseToDownload.changelog,
            downloadUrl: binaryToUse.downloadUrl,
            expectedHash: binaryToUse.sha256sum,
            downloadPath: path.join(downloadPath, uuid.v4())
        });
    }

    /**
     * @private
     * @return {string|null}
     */
    getDownloadPath() {
        let downloadLocation;

        try {
            fs.accessSync(process.argv0, fs.constants.W_OK);
        } catch (e) {
            this.state = new States.ValetudoUpdaterErrorState({
                type: States.ValetudoUpdaterErrorState.ERROR_TYPE.NOT_WRITABLE,
                message: `Updating is impossible because binary location "${process.argv0}" is not writable.`
            });

            return null;
        }

        const spaceBinaryLocation = Tools.GET_DISK_SPACE_INFO(process.argv0);

        if (spaceBinaryLocation === null) {
            this.state = new States.ValetudoUpdaterErrorState({
                type: States.ValetudoUpdaterErrorState.ERROR_TYPE.NOT_ENOUGH_SPACE,
                message: `Unable to determine the free space of ${process.argv0}.`
            });

            return null;
        } else if (spaceBinaryLocation.free < Updater.SPACE_REQUIREMENTS) {
            this.state = new States.ValetudoUpdaterErrorState({
                type: States.ValetudoUpdaterErrorState.ERROR_TYPE.NOT_ENOUGH_SPACE,
                message: `
                        Updating is impossible because there's not enough space to store the new binary at ${process.argv0}. 
                        Required: ${Updater.SPACE_REQUIREMENTS} bytes. Available: ${spaceBinaryLocation.free} bytes.
                        `
            });

            return null;
        }

        const tmpPath = os.tmpdir();
        const spaceTmp = Tools.GET_DISK_SPACE_INFO(tmpPath);

        if (spaceTmp === null) {
            this.state = new States.ValetudoUpdaterErrorState({
                type: States.ValetudoUpdaterErrorState.ERROR_TYPE.NOT_ENOUGH_SPACE,
                message: `Unable to determine the free space of ${tmpPath}.`
            });

            return null;
        } else if (spaceTmp.free < Updater.SPACE_REQUIREMENTS) {
            const shmPath = "/dev/shm";
            const spaceShm = Tools.GET_DISK_SPACE_INFO(shmPath);

            if (spaceShm === null) {
                this.state = new States.ValetudoUpdaterErrorState({
                    type: States.ValetudoUpdaterErrorState.ERROR_TYPE.NOT_ENOUGH_SPACE,
                    message: `Unable to determine the free space of ${shmPath}.`
                });

                return null;
            } else if (spaceShm.free < Updater.SPACE_REQUIREMENTS) {
                this.state = new States.ValetudoUpdaterErrorState({
                    type: States.ValetudoUpdaterErrorState.ERROR_TYPE.NOT_ENOUGH_SPACE,
                    message: `
                        Updating is impossible because there's no download location with enough free space available.
                        Required: ${Updater.SPACE_REQUIREMENTS} bytes. 
                        
                        ${tmpPath} only has ${spaceTmp.free} bytes of free space. 
                        ${shmPath} only has ${spaceShm.free} bytes of free space.
                        `
                });

                return null;
            } else {
                downloadLocation = shmPath;
            }
        } else {
            downloadLocation = tmpPath;
        }

        try {
            fs.accessSync(downloadLocation, fs.constants.W_OK);
        } catch (e) {
            this.state = new States.ValetudoUpdaterErrorState({
                type: States.ValetudoUpdaterErrorState.ERROR_TYPE.NOT_WRITABLE,
                message: `Updating is impossible because download location "${downloadLocation}" is not writable.`
            });

            return null;
        }

        return downloadLocation;
    }
}

Updater.SPACE_REQUIREMENTS = 40 * 1024 * 1024;
Updater.ARCHITECTURES = {
    "arm": "armv7",
    "arm64": "aarch64"
};

module.exports = Updater;
