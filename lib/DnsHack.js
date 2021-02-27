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
 */
class DnsHack {
    /**
     *
     * @param {object} options
     */
    constructor(options) {
        if (dns.lookup.name === "lookupResolveHack") {
            throw new Error("Tried to Monkey-patch dns.lookup multiple times. Aborting");
        }

        const realLookup = dns.lookup;

        //@ts-ignore
        dns.lookup = function lookupResolveHack(hostname, options, callback) {
            if (typeof options === "function") {
                callback = options;
            }
            //We're completely ignoring the options here.
            //If ever anything regarding dns behaves weirdly, make sure to check that this isn't the cause

            if (typeof hostname === "string") {
                const trimmedHostname = hostname.trim();

                if (trimmedHostname.match(IPV4REGEX) !== null) {
                    callback(null, trimmedHostname, 4);
                } else if (trimmedHostname.match(IPV6REGEX) !== null) {
                    callback(null, trimmedHostname, 6);
                } else {
                    Logger.trace("Intercepting dns.lookup call for", trimmedHostname);

                    dns.resolve4(trimmedHostname, (err, addresses) => {
                        if (err && err.code === "ENOTFOUND") {
                            dns.resolve6(trimmedHostname, (err, addresses) => {
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
        };

        dns.lookup.__promisify__ = realLookup.__promisify__;
    }
}

//https://www.oreilly.com/library/view/regular-expressions-cookbook/9780596802837/ch07s16.html
const IPV4REGEX = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

//https://www.oreilly.com/library/view/regular-expressions-cookbook/9781449327453/ch08s17.html
const IPV6REGEX = /^(?:[A-F0-9]{1,4}:){7}[A-F0-9]{1,4}$/i;

module.exports = DnsHack;
