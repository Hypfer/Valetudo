class LinuxToolsHelper {
    static PARSE_PROC_CMDLINE(cmdline) {
        const pairs = cmdline.trim().split(" ");
        const output = {};

        pairs.forEach(pair => {
            const splitPair = pair.split("=");

            output[splitPair[0]] = splitPair[1] ?? true;
        });

        if (output["partitions"] !== undefined) {
            output["partitions"] = LinuxToolsHelper.PARSE_PARTITIONS_LINUX_COMMANDLINE_PARAMETER(output["partitions"]);
        }

        return output;
    }

    /**
     * The format can be found in /block/partitions/cmdline.c of the linux kernel source
     *
     * @param {string} partitions
     */
    static PARSE_PARTITIONS_LINUX_COMMANDLINE_PARAMETER(partitions) {
        const pairs = partitions.split(":");
        const output = {};

        pairs.forEach(pair => {
            const splitPair = pair.split("@");

            //For consistency with other parameters such as "root", we prepend the "/dev/" here
            output[`/dev/${splitPair[1]}`] = splitPair[0];
        });

        return output;
    }

    /**
     *  Note that all values are returned as bytes
     *
     *
     * @param {string} meminfo
     * @return {object}
     */
    static PARSE_PROC_MEMINFO(meminfo) {
        const output = {};

        meminfo.trim().split("\n").forEach(line => {
            const parsed = /^(?<key>.+):\s+(?<value>\d+) kB$/.exec(line);

            if (parsed?.groups?.key !== undefined && parsed?.groups?.value !== undefined) {
                output[parsed.groups.key] = parseInt(parsed.groups.value) * 1024;
            }
        });

        return output;
    }

    /**
     * 
     * @param {string} route
     * @return {Array<object>}
     */
    static PARSE_PROC_NET_ROUTE(route) {
        const lines = route.replace(/[\t ]+/g, " ").trim().split("\n").map(l => l.trim());
        const fields = lines[0].split(" ");

        const entries = [];
        lines.slice(1).forEach(line => {
            const entry = {};

            line.split(" ").forEach((val, i) => {
                const key = fields[i];

                if (key) {
                    switch (key) {
                        case "Destination":
                        case "Gateway":
                        case "Mask": {
                            const matched = val.match(NET_ROUTE_ADDRESS_REGEX);

                            if (matched) {
                                entry[key] = [
                                    parseInt("0x" + matched.groups.octet0, 16),
                                    parseInt("0x" + matched.groups.octet1, 16),
                                    parseInt("0x" + matched.groups.octet2, 16),
                                    parseInt("0x" + matched.groups.octet3, 16),
                                ].join(".");
                            }

                            break;
                        }
                        default:
                            entry[key] = val;
                    }
                }
            });

            if (Object.keys(entry).length > 0) {
                entries.push(entry);
            }
        });

        return entries;
    }
}

const NET_ROUTE_ADDRESS_REGEX = /^(?<octet3>[a-zA-Z0-9]{2})(?<octet2>[a-zA-Z0-9]{2})(?<octet1>[a-zA-Z0-9]{2})(?<octet0>[a-zA-Z0-9]{2})$/;

module.exports = LinuxToolsHelper;
