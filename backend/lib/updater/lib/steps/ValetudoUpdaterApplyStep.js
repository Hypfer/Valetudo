const fs = require("fs");
const ValetudoUpdaterStep = require("./ValetudoUpdaterStep");
const {spawnSync} = require("child_process");

class ValetudoUpdaterApplyStep extends ValetudoUpdaterStep {
    /**
     * @param {object} options
     * @param {string} options.downloadPath
     */
    constructor(options) {
        super();

        this.downloadPath = options.downloadPath;
    }

    // @ts-ignore - Because spawnSync("reboot") ends our process, we don't have to return anything
    async execute() {
        fs.unlinkSync(process.argv0);
        fs.copyFileSync(this.downloadPath, process.argv0);
        fs.chmodSync(process.argv0, fs.constants.S_IXUSR | fs.constants.S_IXGRP | fs.constants.S_IXOTH);
        fs.unlinkSync(this.downloadPath);

        spawnSync("sync");
        spawnSync("reboot");
    }
}

module.exports = ValetudoUpdaterApplyStep;
