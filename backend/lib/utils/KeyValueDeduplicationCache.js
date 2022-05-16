const crypto = require("crypto");
const os = require("os");

class KeyValueDeduplicationCache {
    /**
     * This thing keeps track of key/value pairs to find out if they've changed.
     *
     * Instead of storing the whole payload, we'll just store a hash to save memory
     * The hashing algorithm is determined based on the hardware we're running on as benchmarks have shown
     * that performance may vary greatly based on cpu architecture
     *
     * Strings in JS are UTF-16 take up 2 byte per character, which ends up as 80 bytes for sha1 and 64 for md5
     * Numbers in JS however will always just take up 8 bytes so instead of saving the hash in hex or base64,
     * we take as much of the hashes a JS number can safely fit and store that. This enables us to greatly reduce
     * the likelihood of collisions without having to use more memory
     *
     * As JS numbers are IEEE-754 doubles, we may safely use up to 2^52-1 without any precision loss
     * 0xfffffffffffff (13x f) is exactly that 2^52-1
     * Thus, we just take the first 13 characters of the hash digest in hex, parse that as int, and we're good.
     *
     * Thanks to Raman Shishniou for this idea!
     *
     *
     * @param {object} options
     */
    constructor(options) {
        this.hashingAlgorithm = KeyValueDeduplicationCache.determineHashAlgorithm();

        this.clear();
    }

    clear() {
        this.cache = new Map();
    }

    /**
     * Returns true if the new value differs from the stored one
     * otherwise returns false
     *
     * Works with strings and buffers. Everything else will always return true
     *
     * @param {string} key
     * @param {any} value
     * @return {boolean}
     */
    update(key, value) {
        if (typeof value === "string" || Buffer.isBuffer(value)) {
            const derivedKey = parseInt(crypto.createHash(this.hashingAlgorithm).update(key).digest("hex").substring(0, 13), 16);
            const derivedValue = parseInt(crypto.createHash(this.hashingAlgorithm).update(value).digest("hex").substring(0, 13), 16);

            // An empty cache for the key will return undefined, which is != any hash. This saves a check :)
            if (this.cache.get(derivedKey) !== derivedValue) {
                this.cache.set(derivedKey, derivedValue);

                return true;
            } else {
                return false;
            }
        } else {
            return true;
        }
    }

    static determineHashAlgorithm() {
        let algorithm = "sha1";
        const cpus = os.cpus();

        // Another approach could be to do a short benchmark on startup like mdadm does, however that would increase startup times.
        if (Array.isArray(cpus) && cpus.length > 0) {
            // Benchmarks have shown that md5 is a lot faster on armv7 than sha1, which is the exact opposite of the results on aarch64 and x86
            if (cpus[0].model.startsWith("ARMv7 Processor")) {
                algorithm = "md5";
            }
        }

        return algorithm;
    }
}

module.exports = KeyValueDeduplicationCache;
