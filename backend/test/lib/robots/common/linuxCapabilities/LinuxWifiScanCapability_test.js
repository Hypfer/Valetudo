const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const { describe, it, beforeEach } = require("node:test");

const LinuxWifiScanCapability = require("../../../../../lib/robots/common/linuxCapabilities/LinuxWifiScanCapability");

describe("LinuxWifiScanCapability", () => {
    let capability;
    beforeEach(() => {
        capability = new LinuxWifiScanCapability({robot: undefined});
    });

    it("parses iw scan output correctly", () => {
        const data = fs.readFileSync(path.join(__dirname, "/res/iw_3.4_scan.txt")).toString();
        const expected = JSON.parse(fs.readFileSync(path.join(__dirname, "/res/iw_3.4_scan.json")).toString());

        const actual = capability.parseScanData(data);

        assert.deepEqual(actual, expected);
    });
});
