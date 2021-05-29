const express = require("express");
const fs = require("fs");
const os = require("os");

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
                mem: {
                    total: os.totalmem(),
                    free: this.getFreeMemory(),
                    valetudo_current: process.memoryUsage()?.rss,
                    valetudo_max: process.resourceUsage()?.maxRSS * 1024
                },
                uptime: Math.floor(os.uptime()),
                load: os.loadavg(),
                cpuCount: os.cpus().length
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

    /**
     * @private
     */
    getFreeMemory() {
        let free;

        try {
            const meminfo = fs.readFileSync("/proc/meminfo").toString();
            free = /MemAvailable:\s*(?<mem_available>\d+) kB/.exec(meminfo)?.groups?.mem_available;
            free = parseInt(free) * 1024;
        } catch (e) {
            //intentional
        }

        return free ?? os.freemem();
    }

    getRouter() {
        return this.router;
    }
}

module.exports = SystemRouter;
