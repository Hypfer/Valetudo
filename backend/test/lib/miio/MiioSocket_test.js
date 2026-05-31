const assert = require("node:assert");
const { describe, it } = require("node:test");

const MiioSocket = require("../../../lib/miio/MiioSocket");

describe("MiioSocket", () => {
    it("generates MessageIds correctly", () => {
        // Jan 1970 means no synced time => 1 msgId per second
        assert.strictEqual(MiioSocket.calculateMsgId(new Date("1970-01-01T00:00:01.000Z")), 1);

        // Up until 1970-01-02, IDs are collision-free to allow the ntp sync to take some time
        assert.strictEqual(MiioSocket.calculateMsgId(new Date("1970-01-01T23:59:59.000Z")), 86399);
        assert.strictEqual(MiioSocket.calculateMsgId(new Date("1970-01-02T00:00:00.000Z")), 86400);

        assert.strictEqual(MiioSocket.calculateMsgId(new Date("1970-01-31T23:59:59.000Z")), 2678399);
        assert.strictEqual(MiioSocket.calculateMsgId(new Date("1970-02-01T00:00:00.000Z")), 2678400);

        // >= Feb 1970 means synced time => 1 msgId every 10ms
        assert.strictEqual(MiioSocket.calculateMsgId(new Date("1970-02-01T00:00:01.000Z")), 267926500);

        // wrapping occurs every ~5965 hours
        assert.strictEqual(MiioSocket.calculateMsgId(new Date("1972-09-21T03:58:09.870Z")), 2147483646);
        assert.strictEqual(MiioSocket.calculateMsgId(new Date("1972-09-21T03:58:09.880Z")), 86400);

        assert.strictEqual(MiioSocket.calculateMsgId(new Date("1973-05-27T16:57:42.340Z")), 2147483646);
        assert.strictEqual(MiioSocket.calculateMsgId(new Date("1973-05-27T16:57:42.350Z")), 86400);
    });
});
