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
        let considered_free;

        /*
            We can't use MemAvailable here, since that's only available on kernel 3.14 and newer
            however roborock still uses kernel 3.4 on some of their devices

            See: https://manpages.debian.org/buster/manpages/proc.5.en.html
         */
        try {
            const meminfo = fs.readFileSync("/proc/meminfo").toString();

            const buffers = /^Buffers:\s*(?<buffers>\d+) kB/m.exec(meminfo)?.groups?.buffers;
            const cached = /^Cached:\s*(?<cached>\d+) kB/m.exec(meminfo)?.groups?.cached;

            considered_free = (parseInt(buffers) + parseInt(cached)) * 1024;
        } catch (e) {
            //intentional
        }

        // This intentionally uses isNaN and not Number.isNaN
        if (isNaN(considered_free)) {
            considered_free = 0;
        }

        return os.freemem() + considered_free;
    }

    getRouter() {
        return this.router;
    }
}

module.exports = SystemRouter;
