const fs = require("fs");
const path = require("path");
const should = require("should");

const LinuxToolsHelper = require("../../../lib/utils/LinuxToolsHelper");

should.config.checkProtoEql = false;

describe("LinuxToolsHelper", function () {

    it("Should parse /proc/meminfo Kernel 3.4.39 from roborock s5 correctly", async function() {
        let data = fs.readFileSync(path.join(__dirname, "/res/meminfo_3.4.39_roborock_s5.txt")).toString().replaceAll("\r", "");
        let expected = JSON.parse(fs.readFileSync(path.join(__dirname, "/res/meminfo_3.4.39_roborock_s5.json")).toString());

        let actual = LinuxToolsHelper.PARSE_PROC_MEMINFO(data);

        actual.should.deepEqual(expected);
    });

    it("Should parse /proc/meminfo Kernel 3.4.39 from viomi v7 correctly", async function() {
        let data = fs.readFileSync(path.join(__dirname, "/res/meminfo_3.4.39_viomi_v7.txt")).toString().replaceAll("\r", "");
        let expected = JSON.parse(fs.readFileSync(path.join(__dirname, "/res/meminfo_3.4.39_viomi_v7.json")).toString());

        let actual = LinuxToolsHelper.PARSE_PROC_MEMINFO(data);

        actual.should.deepEqual(expected);
    });

    it("Should parse /proc/meminfo Kernel 4.9.191 from dreame z10 correctly", async function() {
        let data = fs.readFileSync(path.join(__dirname, "/res/meminfo_4.9.191_dreame_z10.txt")).toString().replaceAll("\r", "");
        let expected = JSON.parse(fs.readFileSync(path.join(__dirname, "/res/meminfo_4.9.191_dreame_z10.json")).toString());

        let actual = LinuxToolsHelper.PARSE_PROC_MEMINFO(data);

        actual.should.deepEqual(expected);
    });





    it("Should parse /proc/cmdline Kernel 3.4.39 from roborock s5 correctly", async function() {
        let data = fs.readFileSync(path.join(__dirname, "/res/cmdline_3.4.39_roborock_s5.txt")).toString();
        let expected = JSON.parse(fs.readFileSync(path.join(__dirname, "/res/cmdline_3.4.39_roborock_s5.json")).toString());

        let actual = LinuxToolsHelper.PARSE_PROC_CMDLINE(data);

        actual.should.deepEqual(expected);
    });

    it("Should parse /proc/cmdline Kernel 3.4.39 from viomi v7 correctly", async function() {
        let data = fs.readFileSync(path.join(__dirname, "/res/cmdline_3.4.39_viomi_v7.txt")).toString();
        let expected = JSON.parse(fs.readFileSync(path.join(__dirname, "/res/cmdline_3.4.39_viomi_v7.json")).toString());

        let actual = LinuxToolsHelper.PARSE_PROC_CMDLINE(data);

        actual.should.deepEqual(expected);
    });

    it("Should parse /proc/cmdline Kernel 4.9.191 from dreame z10 correctly", async function() {
        let data = fs.readFileSync(path.join(__dirname, "/res/cmdline_4.9.191_dreame_z10.txt")).toString();
        let expected = JSON.parse(fs.readFileSync(path.join(__dirname, "/res/cmdline_4.9.191_dreame_z10.json")).toString());

        let actual = LinuxToolsHelper.PARSE_PROC_CMDLINE(data);

        actual.should.deepEqual(expected);
    });



});
