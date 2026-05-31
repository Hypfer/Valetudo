const assert = require("node:assert");
const fs = require("fs").promises;
const path = require("path");
const { describe, it } = require("node:test");

const ThreeIRobotixMapParser = require("../../../../lib/robots/3irobotix/ThreeIRobotixMapParser");
const { assertParsedMap } = require("../../../helpers/map");

const assertMapParses = async (binName, jsonName) => {
    const data = await fs.readFile(path.join(__dirname, "/res/map/", binName));
    const expected = JSON.parse(await fs.readFile(path.join(__dirname, "/res/map/", jsonName), { encoding: "utf-8" }));
    const preprocessedData = await ThreeIRobotixMapParser.PREPROCESS(data);
    const actual = ThreeIRobotixMapParser.PARSE(preprocessedData);

    assertParsedMap(actual, expected);
};

describe("ThreeIRobotixMapParser", () => {
    it("pre-processes & parses viomi v7 fw 47 map with currently cleaned segments", async () => {
        await assertMapParses("viomi_v7_47_cleaned_segment_ids.bin", "viomi_v7_47_cleaned_segment_ids.json");
    });

    it("pre-processes & parses viomi v6 fw 41 map with virtual restrictions and active zones", async () => {
        await assertMapParses("viomi_v6_41_virtual_restrictions_and_active_zones.bin", "viomi_v6_41_virtual_restrictions_and_active_zones.json");
    });

    it("pre-processes & parses viomi v6 fw 41 map with no path", async () => {
        await assertMapParses("viomi_v6_41_no_path.bin", "viomi_v6_41_no_path.json");
    });

    it("pre-processes & ignores viomi v6 fw 41 map with no unique map id and no pixels", async () => {
        const data = await fs.readFile(path.join(__dirname, "/res/map/viomi_v6_41_no_uniquemapid.bin"));
        const preprocessedData = await ThreeIRobotixMapParser.PREPROCESS(data);
        const actual = ThreeIRobotixMapParser.PARSE(preprocessedData);

        assert.strictEqual(actual, null);
    });

    it("pre-processes & parses conga 3290 converted to viomi v6 fw 41 map with no unique map id but with pixels", async () => {
        await assertMapParses("converted_3290_no_id.bin", "converted_3290_no_id.json");
    });

    it("pre-processes & parses conga 3290 converted to viomi v6 fw 41 map with no unique map id but with segment pixels", async () => {
        await assertMapParses("converted_3290_noid_segments.bin", "converted_3290_noid_segments.json");
    });

    it("pre-processes & parses conga 3790 converted to viomi v6 fw 41 map", async () => {
        await assertMapParses("converted_3790.bin", "converted_3790.json");
    });
});
