const assert = require("node:assert");
const { describe, it } = require("node:test");

const KeyValueDeduplicationCache = require("../../../lib/utils/KeyValueDeduplicationCache");

describe("KeyValueDeduplicationCache", () => {

    it("deduplicates strings", () => {
        const cache = new KeyValueDeduplicationCache();

        assert.strictEqual(cache.update("theKey", "theValue"), true);
        assert.strictEqual(cache.update("theKey", "theValue"), false);
        assert.strictEqual(cache.update("theKey", "value2"), true);
        assert.strictEqual(cache.update("theKey", "value2"), false);

        assert.strictEqual(cache.update("theKey2", "someValue"), true);
        assert.strictEqual(cache.update("theKey", "value2"), false);
        assert.strictEqual(cache.update("theKey2", "someValue"), false);
    });

    it("deduplicates buffers", () => {
        const cache = new KeyValueDeduplicationCache();

        assert.strictEqual(cache.update("theKey", Buffer.from("theValue")), true);
        assert.strictEqual(cache.update("theKey", Buffer.from("theValue")), false);
        assert.strictEqual(cache.update("theKey", Buffer.from("value2")), true);
        assert.strictEqual(cache.update("theKey", Buffer.from("value2")), false);

        assert.strictEqual(cache.update("theKey2", Buffer.from("someValue")), true);
        assert.strictEqual(cache.update("theKey", Buffer.from("value2")), false);
        assert.strictEqual(cache.update("theKey2", Buffer.from("someValue")), false);
    });
});
