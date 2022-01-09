const fs = require("fs");
const os = require("os");
const path = require("path");
const spawnSync = require("child_process").spawnSync;
const uuid = require("uuid");
const zooIDs = require("zoo-ids");

let SYSTEM_ID;

class Tools {
    static MK_DIR_PATH(filepath) {
        var dirname = path.dirname(filepath);
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
            const rootDirectory = path.resolve(__dirname, "../..");
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
            const rootDirectory = path.resolve(__dirname, "../..");
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


        let macAddresses = Tools.GET_NETWORK_INTERFACE_MACS_FROM_NODEJS();

        if (os.type() === "Linux") {
            try {
                macAddresses = Tools.GET_NETWORK_INTERFACE_MACS_FROM_SYSFS();
            } catch (e) {
                /*
                    Referencing the Logger here would be a circular dependency
                    Therefore, to at least log this somewhere we have to use console.log
                 */

                // eslint-disable-next-line no-console
                console.warn("Error while retrieving network interface macs from sysfs", e);
            }
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

    static PARSE_PROC_CMDLINE() {
        const cmdline = fs.readFileSync("/proc/cmdline").toString()?.split(" ") ?? [];
        const rootPartition = cmdline.find(e => {
            return e.startsWith("root=");
        })?.split("=")?.[1]?.replace("/dev/", "");

        const partitions = {};
        cmdline.find(e => {
            return e.startsWith("partitions=");
        })?.split("=")?.[1]?.split(":")?.forEach(partitionEntry => {
            const entry = partitionEntry.split("@");
            partitions[entry[1]] = entry[0];
        });

        return {
            cmdline: cmdline,
            rootPartition: rootPartition,
            partitions: partitions
        };
    }

    static CLONE(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    /**
     * Returns the total and free size in bytes
     *
     * @param {string} pathOnDisk
     * @returns {{total: number, free: number} | null}
     */
    static GET_DISK_SPACE_INFO(pathOnDisk) {
        try {
            //Inspired by https://github.com/Alex-D/check-disk-space
            const dfResult = spawnSync("df", ["-Pk", "--", pathOnDisk]);
            const dfOutput = dfResult.stdout.toString().trim().split("\n").slice(1).map(l => {
                return l.trim().split(/\s+(?=[\d/])/);
            });

            if (dfOutput.length !== 1 || dfOutput[0].length !== 6) {
                return null;
            }

            return {
                total: parseInt(dfOutput[0][1], 10) * 1024,
                free: parseInt(dfOutput[0][3], 10) * 1024,
            };
        } catch (e) {
            return null;
        }
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

    static GET_NETWORK_INTERFACE_MACS_FROM_SYSFS() {
        const interfaces = fs.readdirSync("/sys/class/net");
        const macAddresses = new Set();

        interfaces.forEach(i => {
            const mac = fs.readFileSync(`/sys/class/net/${i}/address`).toString().trim();

            if (!mac.startsWith("00:00")) {
                /*
                    Some supported robots feature two wireless interfaces of which one is never used
                    as it is only capable of Wi-Fi direct

                    Currently (2021-12-28) all wlan1 use the mac of wlan0 with the first octet incremented
                    by 2 which we'll use here to filter out the bogus interfaces
                    This might be specific to the realtek Wi-Fi chips used by basically all of them

                    This code is not great.
                 */
                const octets = mac.split(":");
                const firstOctetAsNumber = parseInt(`0x${octets.shift()}`);
                octets.unshift((firstOctetAsNumber - 2).toString(16));

                const possibleBaseMac = octets.join(":");

                if (!macAddresses.has(possibleBaseMac)) {
                    macAddresses.add(mac);
                }
            }
        });

        return Array.from(macAddresses.values());
    }
}

const VALETUDO_NAMESPACE = "be5f1ffc-c150-4785-9ebb-08fcfe90c933";

module.exports = Tools;
