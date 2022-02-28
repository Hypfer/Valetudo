const should = require("should");

const MiioSocket = require("../../../lib/miio/MiioSocket");

should.config.checkProtoEql = false;

describe("MiioSocket", function () {
    it("Should generate MessageIds correctly", async function() {
        //Jan 1970 means no synced time => 1 msgId per second
        MiioSocket.calculateMsgId(new Date("1970-01-01T00:00:01.000Z")).should.equal(1);

        // Up until 1970-01-02, IDs are collision-free to allow the ntp sync to take some time
        MiioSocket.calculateMsgId(new Date("1970-01-01T23:59:59.000Z")).should.equal(86399);
        MiioSocket.calculateMsgId(new Date("1970-01-02T00:00:00.000Z")).should.equal(86400);

        MiioSocket.calculateMsgId(new Date("1970-01-31T23:59:59.000Z")).should.equal(2678399);
        MiioSocket.calculateMsgId(new Date("1970-02-01T00:00:00.000Z")).should.equal(2678400);

        // >= Feb 1970 means synced time => 1 msgId every 10ms
        MiioSocket.calculateMsgId(new Date("1970-02-01T00:00:01.000Z")).should.equal(267926500);


        //wrapping occurs every ~5965 hours
        MiioSocket.calculateMsgId(new Date("1972-09-21T03:58:09.870Z")).should.equal(2147483646);
        MiioSocket.calculateMsgId(new Date("1972-09-21T03:58:09.880Z")).should.equal(86400);

        MiioSocket.calculateMsgId(new Date("1973-05-27T16:57:42.340Z")).should.equal(2147483646);
        MiioSocket.calculateMsgId(new Date("1973-05-27T16:57:42.350Z")).should.equal(86400);
    });
});
