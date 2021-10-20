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
    triggerStart() {
        if (!(this.state instanceof States.ValetudoUpdaterIdleState || this.state instanceof States.ValetudoUpdaterErrorState)) {
            throw new Error("Updates can only be started when the updaters state is idle or error");
        }


        this.start().catch(err => {
            //This should never happen
            Logger.error("Unexpected error during startUpdate", err);
        });

        return true;
    }

    triggerDownload() {
        if (!(this.state instanceof States.ValetudoUpdaterApprovalPendingState)) {
            throw new Error("Downloads can only be started when there's pending approval");
        }

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
    async start() {
        const lowmemRequired = os.totalmem() < Updater.LOWMEM_THRESHOLD;
        const archRequired = Updater.ARCHITECTURES[process.arch];
        let binaryRequired = `valetudo-${archRequired}${lowmemRequired ? "-lowmem" : ""}${Tools.IS_UPX_COMPRESSED(process.argv0) ? ".upx" : ""}`;

        if (this.config.get("embedded") !== true) {
            this.state = new States.ValetudoUpdaterErrorState({
                type: States.ValetudoUpdaterErrorState.ERROR_TYPE.NOT_EMBEDDED,
                message: "Updating is only possible in embedded mode"
            });

            return null;
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

            return null;
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
        const currentVersionIndex = releaseVersions.indexOf(Tools.GET_VALETUDO_VERSION());
        let releaseToDownload;

        /*
            Always try to pick the next chronological release if possible
         */
        if (currentVersionIndex > 0) {
            releaseToDownload = releases[currentVersionIndex-1];
        } else {
            releaseToDownload = releases[0];
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
        let downloadLocation = os.tmpdir();
        let space;

        try {
            fs.accessSync(process.argv0, fs.constants.W_OK);
        } catch (e) {
            this.state = new States.ValetudoUpdaterErrorState({
                type: States.ValetudoUpdaterErrorState.ERROR_TYPE.NOT_WRITABLE,
                message: `Updating is impossible because binary location "${process.argv0}" is not writable.`
            });

            return null;
        }

        space = Tools.GET_DISK_SPACE_INFO(downloadLocation);

        if (space.free < Updater.SPACE_REQUIREMENTS) {
            downloadLocation = "/dev/shm";

            if (space.free < Updater.SPACE_REQUIREMENTS) {
                this.state = new States.ValetudoUpdaterErrorState({
                    type: States.ValetudoUpdaterErrorState.ERROR_TYPE.NOT_ENOUGH_SPACE,
                    message: `Updating is impossible because ${downloadLocation} only has ${space.free} bytes of free space. Required: ${Updater.SPACE_REQUIREMENTS} bytes.`
                });

                return null;
            }
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
Updater.LOWMEM_THRESHOLD = 300 * 1024 * 1024;
Updater.ARCHITECTURES = {
    "arm": "armv7",
    "arm64": "aarch64"
};

module.exports = Updater;
