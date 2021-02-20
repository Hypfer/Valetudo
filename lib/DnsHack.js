const dns = require("dns");

const Logger = require("./Logger");

/*
    This class only exists because currently, the statically-linked nodejs base binaries segfault on dns.lookup().
    However this doesn't happen on dns.resolve().

    This caused Valetudo crashing if the mqtt broker was specified by hostname.

    Simply resolving any hostnames before connecting to them isn't an option though,
    since then certificate validation will fail.

    Therefore, the only way to mitigate this is to overwrite dns.lookup and redirect all calls of the MQTT client
    by looking at the stacktrace of the call.

    I'm sorry.
 */
class DnsHack {
    /**
     *
     * @param {object} options
     * @param {import("./Configuration")} options.config
     */
    constructor(options) {
        const self = this;

        this.config = options.config;
        this.hosts = {
            mqtt: undefined,
            ntp: undefined
        };


        if (dns.lookup.name === "lookupResolveHack") {
            throw new Error("Tried to Monkey-patch dns.lookup multiple times. Aborting");
        }

        this.config.onUpdate(async (key) => {
            if (key === "mqtt" || key === "ntpClient") {
                this.updateHosts();
            }
        });
        this.updateHosts();


        const realLookup = dns.lookup;

        //@ts-ignore
        dns.lookup = function lookupResolveHack(hostname, options, callback) {
            if (typeof options === "function") {
                callback = options;
                return realLookup(hostname, options, callback);
            }

            if (
                (
                    Object.getOwnPropertyNames(options).length === 2 &&
                    options.family === undefined
                ) || hostname === self.hosts.mqtt || hostname === self.hosts.ntp
            ) {
                //This sorta looks like something that might be a request from the MQTT client
                //Time to take a look at the stacktrace to make sure
                //Doing this after checking the previous condition saves us from creating a stacktrace
                //on each udp send which would be horrible for the performance
                const stack = new Error().stack;

                if (
                    stack.includes("lookupAndConnect") || //nodejs internal function
                    hostname === self.hosts.mqtt || hostname === self.hosts.ntp
                ) {
                    Logger.trace("Intercepting dns.lookup call for", hostname);

                    if (typeof hostname === "string") {
                        const trimmedHostname = hostname.trim();

                        if (trimmedHostname.match(IPV4REGEX) !== null) {
                            callback(null, trimmedHostname, 4);
                        } else if (trimmedHostname.match(IPV6REGEX) !== null) {
                            callback(null, trimmedHostname, 6);
                        } else {
                            dns.resolve4(hostname, (err, addresses) => {
                                if (err && err.code === "ENOTFOUND") {
                                    dns.resolve6(hostname, (err, addresses) => {
                                        if (err) {
                                            callback(err);
                                        } else {
                                            callback(null, addresses[0], 6);
                                        }
                                    });
                                } else if (err) {
                                    callback(err);
                                } else {
                                    callback(null, addresses[0], 4);
                                }
                            });
                        }
                    } else {
                        callback(new Error("Invalid Hostname"));
                    }
                } else {
                    return realLookup(hostname, options, callback);
                }
            } else {
                return realLookup(hostname, options, callback);
            }
        };

        dns.lookup.__promisify__ = realLookup.__promisify__;
    }

    /**
     * @private
     */
    updateHosts() {
        const mqttConfig = this.config.get("mqtt");
        const ntpConfig = this.config.get("ntpClient");

        this.hosts.mqtt = mqttConfig.server;
        this.hosts.ntp = ntpConfig.server;
    }
}

//https://www.oreilly.com/library/view/regular-expressions-cookbook/9780596802837/ch07s16.html
const IPV4REGEX = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

//https://www.oreilly.com/library/view/regular-expressions-cookbook/9781449327453/ch08s17.html
const IPV6REGEX = /^(?:[A-F0-9]{1,4}:){7}[A-F0-9]{1,4}$/i;

module.exports = DnsHack;
