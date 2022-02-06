const express = require("express");
const os = require("os");
const Tools = require("../utils/Tools");

class SystemRouter {
    /**
     *
     * @param {object} options
     */
    constructor(options) {
        this.router = express.Router({mergeParams: true});

        this.initRoutes();
    }


    initRoutes() {
        this.router.get("/host/info", (req, res) => {
            res.json({
                hostname: os.hostname(),
                arch: os.arch(),
                uptime: Math.floor(os.uptime()),
                ...Tools.GET_SYSTEM_STATS(),
            });
        });

        this.router.get("/runtime/info", (req, res) => {
            res.json({
                uptime: Math.floor(process.uptime()),
                argv: process.argv,
                execArgv: process.execArgv,
                execPath: process.execPath,
                uid: typeof process.getuid === "function" ? process.geteuid() : -1,
                gid: typeof process.getegid === "function" ? process.getegid() : -1,
                pid: process.pid,
                versions: process.versions,
                env: process.env
            });
        });
    }

    getRouter() {
        return this.router;
    }
}

module.exports = SystemRouter;
