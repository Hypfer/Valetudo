const crc = require("crc");
const crypto = require("crypto");

class KeyValueDeduplicationCache {
    /**
     * This thing keeps track of key/value pairs to find out if they've changed.
     *
     * To optimize this for memory usage, it stores the crc32 of key and value.
     * While unlikely, this may cause weird behaviour caused by collisions.
     * As these crc32 pairs take up way less RAM (1/3 or better) than pairs of two sha1 (or similar) strings,
     * it should be fine for this use-case
     *
     * Still, when using this, you should keep in mind that the possibility of collisions not only exists
     * but is relatively likely compared to actual cryptographic hash functions
     *
     * @param {object} options
     */
    constructor(options) {
        this.clear();
    }

    clear() {
        this.cache = {};
    }

    /**
     * Returns true if the new value differs from the stored one
     * otherwise returns false
     *
     * Will always return true for things that aren't strings (for now?)
     *
     * @param {string} key
     * @param {any} value
     * @return {boolean}
     */
    update(key, value) {
        const derivedKey = crc.crc32(key);
        let derivedValue = null;

        if (typeof value === "string") {
            derivedValue = crc.crc32(value);
        } else if (value instanceof Buffer) {
            // crypto's md5 hash are much faster than pure js crc implementation for large buffers
            derivedValue = crypto.createHash("md5").update(value).digest().readUIntBE(0, 6);
        }

        if (derivedValue !== null) {
            // An empty cache for the key will return undefined, which is != any crc32/md5. This saves a check :)
            if (this.cache[derivedKey] !== derivedValue) {
                this.cache[derivedKey] = derivedValue;

                return true;
            } else {
                return false;
            }
        } else {
            return true;
        }
    }
}

module.exports = KeyValueDeduplicationCache;
