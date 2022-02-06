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
}

module.exports = LinuxToolsHelper;
