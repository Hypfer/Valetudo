const assert = require("node:assert");
const fs = require("fs").promises;
const path = require("path");
const { describe, it } = require("node:test");

const RoborockMapParser = require("../../../../lib/robots/roborock/RoborockMapParser");
const { assertParsedMap } = require("../../../helpers/map");

describe("RoborockMapParser", () => {
    it("does not parse random junk", () => {
        const data = Buffer.allocUnsafe(64);
        const actual = RoborockMapParser.PARSE(data);

        assert.strictEqual(actual, null);
    });

    it("parses s5 map without extra data from firmware 1886 correctly", async () => {
        const data = await fs.readFile(path.join(__dirname, "/res/map/S5_FW1886_without_extra_data.bin"));
        const expected = JSON.parse(await fs.readFile(path.join(__dirname, "/res/map/S5_FW1886_without_extra_data.json"), { encoding: "utf-8" }));

        const actual = RoborockMapParser.PARSE(data);

        assertParsedMap(actual, expected);
    });

    it("parses s5 map with forbidden_zones,virtual_walls,currently_cleaned_zones from firmware 1886 correctly", async () => {
        const data = await fs.readFile(path.join(__dirname, "/res/map/S5_FW1886_with_forbidden_zones_and_virtual_walls_and_currently_cleaned_zones.bin"));
        const expected = JSON.parse(await fs.readFile(path.join(__dirname, "/res/map/S5_FW1886_with_forbidden_zones_and_virtual_walls_and_currently_cleaned_zones.json"), { encoding: "utf-8" }));

        const actual = RoborockMapParser.PARSE(data);

        assertParsedMap(actual, expected);
    });

    it("parses s5 map with goto_target from firmware 1886 correctly", async () => {
        const data = await fs.readFile(path.join(__dirname, "/res/map/S5_FW1886_with_goto_target.bin"));
        const expected = JSON.parse(await fs.readFile(path.join(__dirname, "/res/map/S5_FW1886_with_goto_target.json"), { encoding: "utf-8" }));

        const actual = RoborockMapParser.PARSE(data);

        assertParsedMap(actual, expected);
    });

    it("parses s5 map with forbidden_zones,virtual_walls,currently_cleaned_zones from firmware 2008 correctly", async () => {
        const data = await fs.readFile(path.join(__dirname, "/res/map/S5_FW2008_with_forbidden_zones_and_virtual_walls_and_currently_cleaned_zones.bin"));
        const expected = JSON.parse(await fs.readFile(path.join(__dirname, "/res/map/S5_FW2008_with_forbidden_zones_and_virtual_walls_and_currently_cleaned_zones.json"), { encoding: "utf-8" }));

        const actual = RoborockMapParser.PARSE(data);

        assertParsedMap(actual, expected);
    });

    it("parses s5 map with segments from firmware 2008 correctly", async () => {
        const data = await fs.readFile(path.join(__dirname, "/res/map/S5_FW2008_with_segments.bin"));
        const expected = JSON.parse(await fs.readFile(path.join(__dirname, "/res/map/S5_FW2008_with_segments.json"), { encoding: "utf-8" }));

        const actual = RoborockMapParser.PARSE(data);

        assertParsedMap(actual, expected);
    });

    it("parses s5 map with segments from firmware 2020 correctly", async () => {
        const data = await fs.readFile(path.join(__dirname, "/res/map/S5_FW2020_with_segments.bin"));
        const expected = JSON.parse(await fs.readFile(path.join(__dirname, "/res/map/S5_FW2020_with_segments.json"), { encoding: "utf-8" }));

        const actual = RoborockMapParser.PARSE(data);

        assertParsedMap(actual, expected);
    });

    it("parses s6 map with segments from firmware 2652 with active segments and no-mop-zones correctly", async () => {
        const data = await fs.readFile(path.join(__dirname, "/res/map/S6_FW2652_with_active_segment_and_no_mop_zone.bin"));
        const expected = JSON.parse(await fs.readFile(path.join(__dirname, "/res/map/S6_FW2652_with_active_segment_and_no_mop_zone.json"), { encoding: "utf-8" }));

        const actual = RoborockMapParser.PARSE(data);

        assertParsedMap(actual, expected);
    });

    it("pre-processes and parses s8 map from firmware 1286 with obstacles correctly", async () => {
        const data = await fs.readFile(path.join(__dirname, "/res/map/S8_FW1286_with_obstacles.bin"));
        const expected = JSON.parse(await fs.readFile(path.join(__dirname, "/res/map/S8_FW1286_with_obstacles.json"), { encoding: "utf-8" }));

        const actual = RoborockMapParser.PARSE(await RoborockMapParser.PREPROCESS(data));

        assertParsedMap(actual, expected);
    });
});
