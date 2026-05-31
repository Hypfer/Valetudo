const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const { describe, it } = require("node:test");

const LinuxToolsHelper = require("../../../lib/utils/LinuxToolsHelper");

describe("LinuxToolsHelper", () => {

    it("parses /proc/meminfo Kernel 3.4.39 from roborock s5 correctly", () => {
        const data = fs.readFileSync(path.join(__dirname, "/res/meminfo_3.4.39_roborock_s5.txt")).toString().replaceAll("\r", "");
        const expected = JSON.parse(fs.readFileSync(path.join(__dirname, "/res/meminfo_3.4.39_roborock_s5.json")).toString());

        const actual = LinuxToolsHelper.PARSE_PROC_MEMINFO(data);

        assert.deepStrictEqual(actual, expected);
    });

    it("parses /proc/meminfo Kernel 3.4.39 from viomi v7 correctly", () => {
        const data = fs.readFileSync(path.join(__dirname, "/res/meminfo_3.4.39_viomi_v7.txt")).toString().replaceAll("\r", "");
        const expected = JSON.parse(fs.readFileSync(path.join(__dirname, "/res/meminfo_3.4.39_viomi_v7.json")).toString());

        const actual = LinuxToolsHelper.PARSE_PROC_MEMINFO(data);

        assert.deepStrictEqual(actual, expected);
    });

    it("parses /proc/meminfo Kernel 4.9.191 from dreame z10 correctly", () => {
        const data = fs.readFileSync(path.join(__dirname, "/res/meminfo_4.9.191_dreame_z10.txt")).toString().replaceAll("\r", "");
        const expected = JSON.parse(fs.readFileSync(path.join(__dirname, "/res/meminfo_4.9.191_dreame_z10.json")).toString());

        const actual = LinuxToolsHelper.PARSE_PROC_MEMINFO(data);

        assert.deepStrictEqual(actual, expected);
    });

    it("parses /proc/cmdline Kernel 3.4.39 from roborock s5 correctly", () => {
        const data = fs.readFileSync(path.join(__dirname, "/res/cmdline_3.4.39_roborock_s5.txt")).toString();
        const expected = JSON.parse(fs.readFileSync(path.join(__dirname, "/res/cmdline_3.4.39_roborock_s5.json")).toString());

        const actual = LinuxToolsHelper.PARSE_PROC_CMDLINE(data);

        assert.deepStrictEqual(actual, expected);
    });

    it("parses /proc/cmdline Kernel 3.4.39 from viomi v7 correctly", () => {
        const data = fs.readFileSync(path.join(__dirname, "/res/cmdline_3.4.39_viomi_v7.txt")).toString();
        const expected = JSON.parse(fs.readFileSync(path.join(__dirname, "/res/cmdline_3.4.39_viomi_v7.json")).toString());

        const actual = LinuxToolsHelper.PARSE_PROC_CMDLINE(data);

        assert.deepStrictEqual(actual, expected);
    });

    it("parses /proc/cmdline Kernel 4.9.191 from dreame z10 correctly", () => {
        const data = fs.readFileSync(path.join(__dirname, "/res/cmdline_4.9.191_dreame_z10.txt")).toString();
        const expected = JSON.parse(fs.readFileSync(path.join(__dirname, "/res/cmdline_4.9.191_dreame_z10.json")).toString());

        const actual = LinuxToolsHelper.PARSE_PROC_CMDLINE(data);

        assert.deepStrictEqual(actual, expected);
    });

    it("parses /proc/net/route Kernel 3.4.39 from roborock a38 correctly", () => {
        const data = fs.readFileSync(path.join(__dirname, "/res/net_route_3.4.39_roborock_a38.txt")).toString();
        const expected = JSON.parse(fs.readFileSync(path.join(__dirname, "/res/net_route_3.4.39_roborock_a38.json")).toString());

        const actual = LinuxToolsHelper.PARSE_PROC_NET_ROUTE(data);

        assert.deepStrictEqual(actual, expected);
    });
});
