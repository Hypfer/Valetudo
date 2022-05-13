const should = require("should");

const KeyValueDeduplicationCache = require("../../../lib/utils/KeyValueDeduplicationCache");

should.config.checkProtoEql = false;

describe("KeyValueDeduplicationCache", function () {

    it("Should deduplicate strings", async function() {
        const cache = new KeyValueDeduplicationCache();

        cache.update("theKey", "theValue").should.equal(true);
        cache.update("theKey", "theValue").should.equal(false);
        cache.update("theKey", "value2").should.equal(true);
        cache.update("theKey", "value2").should.equal(false);

        cache.update("theKey2", "someValue").should.equal(true);
        cache.update("theKey", "value2").should.equal(false);
        cache.update("theKey2", "someValue").should.equal(false);
    });

    it("Should deduplicate buffers", async function() {
        const cache = new KeyValueDeduplicationCache();

        cache.update("theKey", Buffer.from("theValue")).should.equal(true);
        cache.update("theKey", Buffer.from("theValue")).should.equal(false);
        cache.update("theKey", Buffer.from("value2")).should.equal(true);
        cache.update("theKey", Buffer.from("value2")).should.equal(false);

        cache.update("theKey2", Buffer.from("someValue")).should.equal(true);
        cache.update("theKey", Buffer.from("value2")).should.equal(false);
        cache.update("theKey2", Buffer.from("someValue")).should.equal(false);
    });
});
