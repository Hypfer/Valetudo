const fs = require("fs");
const LinuxToolsHelper = require("./LinuxToolsHelper");
const {spawnSync, execSync} = require("child_process");

class LinuxTools {
    /**
     * @return {object}
     */
    static READ_PROC_CMDLINE() {
        const cmdline = fs.readFileSync("/proc/cmdline").toString();

        return LinuxToolsHelper.PARSE_PROC_CMDLINE(cmdline);
    }

    /**
     * @return {object}
     */
    static READ_PROC_MEMINFO() {
        const meminfo = fs.readFileSync("/proc/meminfo").toString();

        return LinuxToolsHelper.PARSE_PROC_MEMINFO(meminfo);
    }

    static GET_FREE_SYSTEM_MEMORY() {
        const meminfo = LinuxTools.READ_PROC_MEMINFO();

        /*
            MemAvailable is only available on kernel 3.14 and newer

            See: https://manpages.debian.org/buster/manpages/proc.5.en.html
         */
        if (meminfo["MemAvailable"] !== undefined) {
            return meminfo["MemAvailable"];
        } else {
            return meminfo["MemFree"] + meminfo["Buffers"] + meminfo["Cached"];
        }
    }

    static GET_NETWORK_INTERFACE_MACS() {
        const interfaces = fs.readdirSync("/sys/class/net");
        const macAddresses = new Set();

        interfaces.filter(i => i !== "bonding_masters").forEach(i => {
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

    /**
     *
     * @returns {string | undefined}
     */
    static GET_GATEWAY_IP() {
        const route = fs.readFileSync("/proc/net/route").toString();
        const routingTableEntries = LinuxToolsHelper.PARSE_PROC_NET_ROUTE(route);

        return routingTableEntries.find(e => e["Destination"] === "0.0.0.0" && e["Gateway"] !== "0.0.0.0")?.["Gateway"];
    }

    /**
     * 
     * @param {Date} date
     */
    static SET_TIME(date) {
        let dateString = "";

        dateString += date.getFullYear().toString();
        dateString += "-";
        dateString += (date.getMonth() + 1).toString().padStart(2, "0");
        dateString += "-";
        dateString += date.getDate().toString().padStart(2, "0");
        dateString += " ";
        dateString += date.getHours().toString().padStart(2, "0");
        dateString += ":";
        dateString += date.getMinutes().toString().padStart(2, "0");
        dateString += ":";
        dateString += date.getSeconds().toString().padStart(2, "0");


        execSync("date -s \""+dateString+"\"");
    }
}

module.exports = LinuxTools;
