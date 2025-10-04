const crypto = require("crypto");
const fs = require("fs");
const Logger = require("../../../Logger");
const PipelineThroughputTracker = require("../../../utils/PipelineThroughputTracker");
const States = require("../../../entities/core/updater");
const ValetudoUpdaterError = require("../ValetudoUpdaterError");
const ValetudoUpdaterStep = require("./ValetudoUpdaterStep");
const {get} = require("../UpdaterUtils");
const {pipeline} = require("stream/promises");

class ValetudoUpdaterDownloadStep extends ValetudoUpdaterStep {
    /**
     * @param {object} options
     * @param {string} options.downloadUrl
     * @param {string} options.downloadPath
     * @param {string} options.expectedHash
     * @param {string} options.version
     * @param {Date}   options.releaseTimestamp
     *
     */
    constructor(options) {
        super();

        this.downloadUrl = options.downloadUrl;
        this.downloadPath = options.downloadPath;
        this.expectedHash = options.expectedHash;
        this.version = options.version;
        this.releaseTimestamp = options.releaseTimestamp;

        /** @type {(number) => void} **/
        this.onProgressUpdate = () => {};
    }

    /**
     * @returns {Promise<import("../../../entities/core/updater").ValetudoUpdaterApplyPendingState>}
     */
    async execute() {
        let fd;

        try {
            const downloadResponse = await get(this.downloadUrl, {responseType: "stream"});
            const expectedDownloadSize = parseInt(downloadResponse.headers?.["content-length"]);

            const progressTracker = new PipelineThroughputTracker((totalBytes) => {
                if (expectedDownloadSize > 0) {
                    let downloadPercentage = totalBytes / expectedDownloadSize;

                    downloadPercentage = downloadPercentage * 100;
                    downloadPercentage = Math.round(downloadPercentage);
                    downloadPercentage = Math.max(downloadPercentage, 0);
                    downloadPercentage = Math.min(downloadPercentage, 100);

                    this.onProgressUpdate(downloadPercentage);
                }
            });

            fd = fs.openSync(this.downloadPath, "w+");

            await pipeline(
                downloadResponse.data,
                progressTracker,
                fs.createWriteStream(null, {fd: fd, flush: true, autoClose: false})
            );
        } catch (e) {
            Logger.error("Error while downloading release binary", e);

            if (fd !== undefined) {
                try {
                    fs.closeSync(fd);
                } catch (e) {
                    /* intentional */
                }

                try {
                    fs.unlinkSync(this.downloadPath);
                } catch (e) {
                    /* intentional */
                }
            }

            throw new ValetudoUpdaterError(
                ValetudoUpdaterError.ERROR_TYPE.DOWNLOAD_FAILED,
                "Error while downloading release binary"
            );
        }

        let checksum;

        try {
            checksum = await new Promise((resolve, reject) => {
                const hash = crypto.createHash("sha256");
                const readStream = fs.createReadStream(null, {fd: fd, start: 0, autoClose: false});

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

            if (fd !== undefined) {
                try {
                    fs.closeSync(fd);
                } catch (e) {
                    /* intentional */
                }

                try {
                    fs.unlinkSync(this.downloadPath);
                } catch (e) {
                    /* intentional */
                }
            }

            throw new ValetudoUpdaterError(
                ValetudoUpdaterError.ERROR_TYPE.UNKNOWN,
                "Error while calculating downloaded binary checksum"
            );
        }

        if (checksum !== this.expectedHash) {
            if (fd !== undefined) {
                try {
                    fs.closeSync(fd);
                } catch (e) {
                    /* intentional */
                }

                try {
                    fs.unlinkSync(this.downloadPath);
                } catch (e) {
                    /* intentional */
                }
            }

            throw new ValetudoUpdaterError(
                ValetudoUpdaterError.ERROR_TYPE.INVALID_CHECKSUM,
                `Expected Checksum: ${this.expectedHash}. Actual: ${checksum}`
            );
        } else {
            return new States.ValetudoUpdaterApplyPendingState({
                version: this.version,
                releaseTimestamp: this.releaseTimestamp,
                downloadPath: this.downloadPath,
                downloadPathFd: fd
            });
        }
    }
}

module.exports = ValetudoUpdaterDownloadStep;
