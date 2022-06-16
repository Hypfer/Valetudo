const fs = require("fs");
const os = require("os");
const path = require("path");
const uuid = require("uuid");
const zooIDs = require("zoo-ids");

const LinuxTools = require("./LinuxTools");

let SYSTEM_ID;

class Tools {
    static MK_DIR_PATH(filepath) {
        const dirname = path.dirname(filepath);

        if (!fs.existsSync(dirname)) {
            Tools.MK_DIR_PATH(dirname);
        }

        if (!fs.existsSync(filepath)) {
            fs.mkdirSync(filepath);
        }
    }

    static ARE_SAME_FILES(filepath1, filepath2) {
        if (filepath1 === filepath2) {
            return true;
        }

        try {
            const stat1 = fs.statSync(filepath1, {bigint: true});
            const stat2 = fs.statSync(filepath2, {bigint: true});
            return (stat1.dev === stat2.dev && stat1.ino === stat2.ino);
        } catch (e) {
            return false;
        }
    }

    static BUFFER_IS_GZIP(buf) {
        return Buffer.isBuffer(buf) && buf[0] === 0x1f && buf[1] === 0x8b;
    }

    static GET_VALETUDO_VERSION() {
        let valetudoVersion = "unknown";

        try {
            const rootDirectory = path.resolve(__dirname, "../../..");
            const packageContent = fs.readFileSync(rootDirectory + "/package.json", {"encoding": "utf-8"});

            if (packageContent) {
                valetudoVersion = JSON.parse(packageContent.toString()).version;
            }
        } catch (e) {
            //intentional
        }

        return valetudoVersion;
    }

    static GET_COMMIT_ID() {
        let commitId = "unknown";

        try {
            const rootDirectory = path.resolve(__dirname, "../../..");
            commitId = fs.readFileSync(rootDirectory + "/.git/HEAD", {"encoding": "utf-8"}).trim();

            if (commitId.match(/^ref: refs\/heads\/master$/) !== null) {
                commitId = fs.readFileSync(rootDirectory + "/.git/refs/heads/master", {"encoding": "utf-8"}).trim();
            }
        } catch (e) {
            //intentional
        }

        return commitId;
    }

    static GET_FREE_SYSTEM_MEMORY() {
        if (os.type() === "Linux") {
            return LinuxTools.GET_FREE_SYSTEM_MEMORY();
        } else {
            return os.freemem();
        }
    }

    static GET_SYSTEM_STATS() {
        const normalizedLoad = os.loadavg().map(v => {
            return v / os.cpus().length;
        });

        return {
            mem: {
                total: os.totalmem(),
                free: Tools.GET_FREE_SYSTEM_MEMORY(),
                //@ts-ignore
                valetudo_current: process.memoryUsage.rss(),
                valetudo_max: process.resourceUsage()?.maxRSS * 1024
            },
            load: {
                "1": normalizedLoad[0],
                "5": normalizedLoad[1],
                "15": normalizedLoad[2]
            }
        };
    }

    static GET_SYSTEM_ID() {
        if (SYSTEM_ID) {
            return SYSTEM_ID;
        }
        let macAddresses = [];

        if (os.type() === "Linux") {
            try {
                macAddresses = LinuxTools.GET_NETWORK_INTERFACE_MACS();
            } catch (e) {
                /*
                    Referencing the Logger here would be a circular dependency
                    Therefore, to at least log this somewhere we have to use console.log
                 */

                // eslint-disable-next-line no-console
                console.warn("Error while retrieving network interface macs from sysfs", e);
            }
        } else {
            macAddresses = Tools.GET_NETWORK_INTERFACE_MACS_FROM_NODEJS();
        }

        SYSTEM_ID = uuid.v5(
            macAddresses.join(""),
            VALETUDO_NAMESPACE
        );

        return SYSTEM_ID;
    }

    static GET_HUMAN_READABLE_SYSTEM_ID() {
        return zooIDs.generateId(Tools.GET_SYSTEM_ID());
    }

    static GET_ZEROCONF_HOSTNAME() {
        return "valetudo-" + Tools.GET_HUMAN_READABLE_SYSTEM_ID().toLowerCase() + ".local";
    }

    static CLONE(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    static IS_UPX_COMPRESSED(pathOnDisk) {
        let is_upx = false;

        try {
            const fd = fs.openSync(pathOnDisk, "r");
            const buf = Buffer.alloc(256);

            //This throws if we don't have access to that fd
            fs.fstatSync(fd);

            fs.readSync(fd, buf, {length: 256});
            fs.closeSync(fd);

            is_upx = buf.toString().includes("UPX");
        } catch (e) {
            //intentional
        }

        return is_upx;
    }

    static IS_LOWMEM_HOST() {
        return os.totalmem() < 300 * 1024 * 1024;
    }

    static GET_RANDOM_ARRAY_ELEMENT(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    static CAPITALIZE(string) {
        return `${string[0].toUpperCase()}${string.slice(1)}`;
    }

    static GET_NETWORK_INTERFACES() {
        return Object.values(os.networkInterfaces())
            .flat()
            .filter(i => {
                return !i.mac.startsWith("00:00");
            });
    }

    static GET_CURRENT_HOST_IP_ADDRESSES() {
        const IPs = Tools
            .GET_NETWORK_INTERFACES()
            .map(i => {
                return i.address;
            });

        return [...new Set(IPs)]; // dedupe
    }

    static GET_NETWORK_INTERFACE_MACS_FROM_NODEJS() {
        const macs = Tools
            .GET_NETWORK_INTERFACES()
            .map(i => {
                return i.mac;
            });

        return [...new Set(macs)]; // dedupe
    }

    // taken from https://stackoverflow.com/a/34491287
    static IS_EMPTY_OBJECT_OR_UNDEFINED_OR_NULL(obj) {
        // noinspection LoopStatementThatDoesntLoopJS
        for (const x in obj) {
            return false;
        }

        return true;
    }
}

const VALETUDO_NAMESPACE = "be5f1ffc-c150-4785-9ebb-08fcfe90c933";

module.exports = Tools;
