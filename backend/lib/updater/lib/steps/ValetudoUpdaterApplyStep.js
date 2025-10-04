const fs = require("fs");
const Logger = require("../../../Logger");
const path = require("path");
const ValetudoUpdaterStep = require("./ValetudoUpdaterStep");
const {pipeline} = require("stream/promises");
const {spawnSync} = require("child_process");

class ValetudoUpdaterApplyStep extends ValetudoUpdaterStep {
    /**
     * @param {object} options
     * @param {string} options.downloadPath
     * @param {number} options.downloadPathFd
     */
    constructor(options) {
        super();

        this.downloadPath = options.downloadPath;
        this.downloadPathFd = options.downloadPathFd;
    }

    // @ts-ignore - Because spawnSync("reboot") ends our process, we don't have to return anything
    async execute() {
        const destinationDir = path.dirname(process.argv0);
        const destinationFilename = path.basename(process.argv0);
        const tmpDestination = path.join(destinationDir, `${destinationFilename}.upd`);

        try {
            const downloadedUpdateReadStream = fs.createReadStream(null, {
                fd: this.downloadPathFd,
                start: 0,
                autoClose: false
            });
            const tmpWriteStream = fs.createWriteStream(tmpDestination, {
                flush: true,
                mode: fs.constants.S_IXUSR | fs.constants.S_IXGRP | fs.constants.S_IXOTH
            });

            await pipeline(downloadedUpdateReadStream, tmpWriteStream);

            fs.closeSync(this.downloadPathFd);

            try {
                fs.unlinkSync(this.downloadPath);
            } catch (e) {
                // intentionally ignored as this is what happens when the file got deleted mid-update
                // we still have the fd and the downloadLocation is usually a ramdisk anyway, so we do not really care
            }

            fs.renameSync(tmpDestination, process.argv0);

            spawnSync("sync");
            spawnSync("reboot");
        } catch (err) {
            try {
                fs.unlinkSync(tmpDestination);
            } catch (e) {
                Logger.warn(`Error while deleting tmp file ${tmpDestination}`, e);
            }

            throw err;
        }
    }
}

module.exports = ValetudoUpdaterApplyStep;
