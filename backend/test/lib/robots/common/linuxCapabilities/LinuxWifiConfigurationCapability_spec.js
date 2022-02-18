const fs = require("fs");
const path = require("path");
const should = require("should");

const LinuxWifiConfigurationCapability = require("../../../../../lib/robots/common/linuxCapabilities/LinuxWifiConfigurationCapability");

should.config.checkProtoEql = false;

describe("LinuxWifiConfigurationCapability", function () {
    let capability;
    beforeEach(function () {
        capability = new LinuxWifiConfigurationCapability({robot: undefined});
    });

    it("Should parse iw connected output correctly", async function() {
        let data = fs.readFileSync(path.join(__dirname, "/res/iw_3.4_connected.txt")).toString();
        let expected = JSON.parse(fs.readFileSync(path.join(__dirname, "/res/iw_3.4_connected.json")).toString());

        let actual = capability.parseIwStdout(data);

        actual.should.deepEqual(expected);
    });

    it("Should parse iw not connected output correctly", async function() {
        let data = fs.readFileSync(path.join(__dirname, "/res/iw_3.4_not_connected.txt")).toString();
        let expected = JSON.parse(fs.readFileSync(path.join(__dirname, "/res/iw_3.4_not_connected.json")).toString());

        let actual = capability.parseIwStdout(data);

        actual.should.deepEqual(expected);
    });

    it("Should parse no output correctly", async function() {
        let data = "";
        let expected = JSON.parse(fs.readFileSync(path.join(__dirname, "/res/no_output.json")).toString());

        let actual = capability.parseIwStdout(data);

        actual.should.deepEqual(expected);
    });
});
