// noinspection JSUnreachableSwitchBranches

const os = require("os");

/*
    This hack restores the old behaviour of os.networkInterfaces() before nodejs v18 as there are a lot of libraries
    that may depend on it, which may never be updated
    
    See https://github.com/nodejs/node/pull/41431
 */

module.exports = {
    apply: () => {
        const realNetworkInterfaces = os.networkInterfaces;

        os.networkInterfaces = function monkeyPatchedOSNetworkInterfaces() {
            const interfaces = realNetworkInterfaces();

            Object.values(interfaces).forEach(addresses => {
                addresses.forEach(addr => {
                    switch (addr.family) {
                        case 4:
                            addr.family = "IPv4";
                            break;
                        case 6:
                            addr.family = "IPv6";
                            break;
                    }
                });
            });

            return interfaces;
        };
    }
};
