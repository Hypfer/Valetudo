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

const realLookup = dns.lookup;

dns.lookup = function lookupResolveHack(hostname, options, callback) {
    if (typeof options === "function") {
        callback = options;
        return realLookup(hostname, options, callback);
    }

    if (
        Object.getOwnPropertyNames(options).length === 2 &&
        options.family === undefined
    ) {
        //This sorta looks like something that might be a request from the MQTT client
        //Time to take a look at the stacktrace to make sure
        //Doing this after checking the previous condition saves us from creating a stacktrace
        //on each udp send which would be horrible for the performance
        const stack = new Error().stack;

        if (stack.includes("lookupAndConnect")) { //nodejs internal function
            Logger.trace("Intercepting dns.lookup call for", hostname);

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
        } else {
            return realLookup(hostname, options, callback);
        }
    } else {
        return realLookup(hostname, options, callback);
    }
};

dns.lookup.__promisify__ = realLookup.__promisify__;

module.exports = null;
