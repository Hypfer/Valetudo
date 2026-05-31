const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const { describe, it, beforeEach } = require("node:test");

const LinuxWifiConfigurationCapability = require("../../../../../lib/robots/common/linuxCapabilities/LinuxWifiConfigurationCapability");

describe("LinuxWifiConfigurationCapability", () => {
    let capability;
    beforeEach(() => {
        capability = new LinuxWifiConfigurationCapability({robot: undefined});
    });

    it("parses iw connected output correctly", () => {
        const data = fs.readFileSync(path.join(__dirname, "/res/iw_3.4_connected.txt")).toString();
        const expected = JSON.parse(fs.readFileSync(path.join(__dirname, "/res/iw_3.4_connected.json")).toString());

        const actual = capability.parseIwStdout(data);

        assert.deepEqual(actual, expected);
    });

    it("parses iw connected with counters correctly", () => {
        const data = fs.readFileSync(path.join(__dirname, "/res/iw_3.4_connected_with_counters.txt")).toString();
        const expected = JSON.parse(fs.readFileSync(path.join(__dirname, "/res/iw_3.4_connected_with_counters.json")).toString());

        const actual = capability.parseIwStdout(data);

        assert.deepEqual(actual, expected);
    });

    it("parses iw not connected output correctly", () => {
        const data = fs.readFileSync(path.join(__dirname, "/res/iw_3.4_not_connected.txt")).toString();
        const expected = JSON.parse(fs.readFileSync(path.join(__dirname, "/res/iw_3.4_not_connected.json")).toString());

        const actual = capability.parseIwStdout(data);

        assert.deepEqual(actual, expected);
    });

    it("parses no output correctly", () => {
        const data = "";
        const expected = JSON.parse(fs.readFileSync(path.join(__dirname, "/res/no_output.json")).toString());

        const actual = capability.parseIwStdout(data);

        assert.deepEqual(actual, expected);
    });
});
