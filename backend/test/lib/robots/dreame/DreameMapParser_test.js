const assert = require("node:assert");
const fs = require("fs").promises;
const path = require("path");
const { describe, it } = require("node:test");

const DreameMapParser = require("../../../../lib/robots/dreame/DreameMapParser");
const { assertParsedMap } = require("../../../helpers/map");

describe("DreameMapParser", () => {

    it("parses D9 FW 1058 no-segment map correctly", async () => {
        const data = await fs.readFile(path.join(__dirname, "/res/map/d9_1058_no_segments.bin"));
        const expected = JSON.parse(await fs.readFile(path.join(__dirname, "/res/map/d9_1058_no_segments.json"), { encoding: "utf-8" }));

        const actual = await DreameMapParser.PARSE(data);

        assertParsedMap(actual, expected);
    });


    it("parses D9 FW 1058 segment map correctly", async () => {
        const data = await fs.readFile(path.join(__dirname, "/res/map/d9_1058_with_segments.bin"));
        const expected = JSON.parse(await fs.readFile(path.join(__dirname, "/res/map/d9_1058_with_segments.json"), { encoding: "utf-8" }));

        const actual = await DreameMapParser.PARSE(data);

        assertParsedMap(actual, expected);
    });

    it("pre-processes & parses D9 FW 1058 \"custom named segment\" map correctly", async () => {
        const data = await fs.readFile(path.join(__dirname, "/res/map/d9_1058_with_custom_named_segments.bin"));
        const expected = JSON.parse(await fs.readFile(path.join(__dirname, "/res/map/d9_1058_with_custom_named_segments.json"), { encoding: "utf-8" }));

        const actual = await DreameMapParser.PARSE(await DreameMapParser.PREPROCESS(data));

        assertParsedMap(actual, expected);
    });

    it("pre-processes & parses D9 FW 1093 \"huge\" map correctly", async () => {
        const data = await fs.readFile(path.join(__dirname, "/res/map/d9_1093_huge.bin"));
        const expected = JSON.parse(await fs.readFile(path.join(__dirname, "/res/map/d9_1093_huge.json"), { encoding: "utf-8" }));

        const actual = await DreameMapParser.PARSE(await DreameMapParser.PREPROCESS(data));

        assertParsedMap(actual, expected);
    });

    it("pre-processes & parses Z10 FW 1056 map with virtual restrictions correctly", async () => {
        const data = await fs.readFile(path.join(__dirname, "/res/map/z10_1056_virtual_restrictions.bin"));
        const expected = JSON.parse(await fs.readFile(path.join(__dirname, "/res/map/z10_1056_virtual_restrictions.json"), { encoding: "utf-8" }));

        const actual = await DreameMapParser.PARSE(await DreameMapParser.PREPROCESS(data));

        assertParsedMap(actual, expected);
    });

    it("pre-processes & parses Z10 FW 1056 map with paths correctly", async () => {
        const data = await fs.readFile(path.join(__dirname, "/res/map/z10_1056_paths.bin"));
        const expected = JSON.parse(await fs.readFile(path.join(__dirname, "/res/map/z10_1056_paths.json"), { encoding: "utf-8" }));

        const actual = await DreameMapParser.PARSE(await DreameMapParser.PREPROCESS(data));

        assertParsedMap(actual, expected);
    });

    it("preprocesses & does not parse Z10 FW 1156 super minimal map", async () => {
        const data = await fs.readFile(path.join(__dirname, "/res/map/z10_1156_super_minimal.bin"));

        const actual = await DreameMapParser.PARSE(await DreameMapParser.PREPROCESS(data));

        assert.strictEqual(actual, null);
    });

    it("pre-processes & parses 1C FW 1096 \"zoned-cleanup in progress\" map correctly", async () => {
        const data = await fs.readFile(path.join(__dirname, "/res/map/1c_1096_zonedcleanup.bin"));
        const expected = JSON.parse(await fs.readFile(path.join(__dirname, "/res/map/1c_1096_zonedcleanup.json"), { encoding: "utf-8" }));

        const actual = await DreameMapParser.PARSE(await DreameMapParser.PREPROCESS(data));

        assertParsedMap(actual, expected);
    });

    it("pre-processes & parses 1C FW 1096 \"full cleanup in progress\" map correctly", async () => {
        const data = await fs.readFile(path.join(__dirname, "/res/map/1c_1096_fullcleanup.bin"));
        const expected = JSON.parse(await fs.readFile(path.join(__dirname, "/res/map/1c_1096_fullcleanup.json"), { encoding: "utf-8" }));

        const actual = await DreameMapParser.PARSE(await DreameMapParser.PREPROCESS(data));

        assertParsedMap(actual, expected);
    });

    it("pre-processes & parses 1C FW 1096 \"area cleanup in progress\" map correctly", async () => {
        const data = await fs.readFile(path.join(__dirname, "/res/map/1c_1096_areacleanup.bin"));
        const expected = JSON.parse(await fs.readFile(path.join(__dirname, "/res/map/1c_1096_areacleanup.json"), { encoding: "utf-8" }));

        const actual = await DreameMapParser.PARSE(await DreameMapParser.PREPROCESS(data));

        assertParsedMap(actual, expected);
    });


    it("pre-processes & parses 1C FW 1096 map with virtual wall & a no-go zone correctly", async () => {
        const data = await fs.readFile(path.join(__dirname, "/res/map/1c_1096_virtualwall_and_forbidden_zone.bin"));
        const expected = JSON.parse(await fs.readFile(path.join(__dirname, "/res/map/1c_1096_virtualwall_and_forbidden_zone.json"), { encoding: "utf-8" }));
        const actual = await DreameMapParser.PARSE(await DreameMapParser.PREPROCESS(data));

        assertParsedMap(actual, expected);
    });

    it("pre-processes & parses L10S Ultra FW 1058 map with goto target correctly", async () => {
        const data = await fs.readFile(path.join(__dirname, "/res/map/l10su_1058_goto_target.bin"));
        const expected = JSON.parse(await fs.readFile(path.join(__dirname, "/res/map/l10su_1058_goto_target.json"), { encoding: "utf-8" }));
        const actual = await DreameMapParser.PARSE(await DreameMapParser.PREPROCESS(data));

        assertParsedMap(actual, expected);
    });

    it("pre-processes & parses L10S Ultra FW 1121 map with new path correctly", async () => {
        const data = await fs.readFile(path.join(__dirname, "/res/map/l10su_1121_new_path.bin"));
        const expected = JSON.parse(await fs.readFile(path.join(__dirname, "/res/map/l10su_1121_new_path.json"), { encoding: "utf-8" }));
        const actual = await DreameMapParser.PARSE(await DreameMapParser.PREPROCESS(data));

        assertParsedMap(actual, expected);
    });

    it("pre-processes & parses L10S Ultra FW 1121 map with carpet correctly", async () => {
        const data = await fs.readFile(path.join(__dirname, "/res/map/l10su_1121_carpet.bin"));
        const expected = JSON.parse(await fs.readFile(path.join(__dirname, "/res/map/l10su_1121_carpet.json"), { encoding: "utf-8" }));
        const actual = await DreameMapParser.PARSE(await DreameMapParser.PREPROCESS(data));

        assertParsedMap(actual, expected);
    });

    it("pre-processes & parses monastery map with left cutoff correctly", async () => {
        const data = await fs.readFile(path.join(__dirname, "/res/map/misc_monastery_with_cutoff.bin"));
        const expected = JSON.parse(await fs.readFile(path.join(__dirname, "/res/map/misc_monastery_with_cutoff.json"), { encoding: "utf-8" }));
        const actual = await DreameMapParser.PARSE(await DreameMapParser.PREPROCESS(data));

        assertParsedMap(actual, expected);
    });

    it("pre-processes & parses X10 Plus FW 1104 map with obstacle correctly", async () => {
        const data = await fs.readFile(path.join(__dirname, "/res/map/x10plus_1104_with_obstacle.bin"));
        const expected = JSON.parse(await fs.readFile(path.join(__dirname, "/res/map/x10plus_1104_with_obstacle.json"), { encoding: "utf-8" }));
        const actual = await DreameMapParser.PARSE(await DreameMapParser.PREPROCESS(data));

        assertParsedMap(actual, expected);
    });

    it("pre-processes & parses L10S Ultra FW 3031 giant map correctly", async () => {
        const data = await fs.readFile(path.join(__dirname, "/res/map/l10su_3031_giant.bin"));
        const expected = JSON.parse(await fs.readFile(path.join(__dirname, "/res/map/l10su_3031_giant.json"), { encoding: "utf-8" }));
        const actual = await DreameMapParser.PARSE(await DreameMapParser.PREPROCESS(data));

        assertParsedMap(actual, expected);
    });
});
