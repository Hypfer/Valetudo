const fs =  require("fs").promises;
const should = require("should");

const RRMapParser = require("../../lib/RRMapParser");

describe("RRMapParser", function () {
    it("should parse map without extra data from firmware 1886 correctly", async function() {
        let data = await fs.readFile("./test/lib/RRMapParser/FW1886_without_extra_data.bin");
        let expected = JSON.parse(await fs.readFile("./test/lib/RRMapParser/FW1886_without_extra_data.json", { encoding: "utf-8" }));

        let actual = RRMapParser.PARSE(data);

        actual.image.position.should.deepEqual(expected.image.position, "position");
        actual.image.dimensions.should.deepEqual(expected.image.dimensions, "dimensions");
        actual.image.pixels.should.deepEqual(expected.image.pixels, "pixels");
        actual.path.should.deepEqual(expected.path, "path");
        actual.charger.should.deepEqual(expected.charger, "charger");
        actual.robot.should.deepEqual(expected.robot, "robot");
        should.not.exists(actual.goto_target, "goto_target");
        should.not.exists(actual.currently_cleaned_zones, "currently_cleaned_zones");
        should.not.exists(actual.no_go_areas, "no_go_areas");
        should.not.exists(actual.virtual_walls, "virtual_walls");
        actual.should.deepEqual(expected, "full");
    });

    it("should parse map with forbidden_zones,virtual_walls,currently_cleaned_zones from firmware 1886 correctly", async function() {
        let data = await fs.readFile("./test/lib/RRMapParser/FW1886_with_forbidden_zones_and_virtual_walls_and_currently_cleaned_zones.bin");
        let expected = JSON.parse(await fs.readFile("./test/lib/RRMapParser/FW1886_with_forbidden_zones_and_virtual_walls_and_currently_cleaned_zones.json", { encoding: "utf-8" }));

        let actual = RRMapParser.PARSE(data);

        actual.image.position.should.deepEqual(expected.image.position, "position");
        actual.image.dimensions.should.deepEqual(expected.image.dimensions, "dimensions");
        actual.image.pixels.should.deepEqual(expected.image.pixels, "pixels");
        actual.path.should.deepEqual(expected.path, "path");
        actual.charger.should.deepEqual(expected.charger, "charger");
        actual.robot.should.deepEqual(expected.robot, "robot");
        should.not.exists(actual.goto_target, "goto_target");
        should.deepEqual(actual.currently_cleaned_zones, expected.currently_cleaned_zones, "currently_cleaned_zones");
        should.deepEqual(actual.no_go_areas, expected.no_go_areas, "no_go_areas");
        should.deepEqual(actual.virtual_walls, expected.virtual_walls, "virtual_walls");
        actual.should.deepEqual(expected, "full");
    });

    it("should parse map with goto_target from firmware 1886 correctly", async function() {
        let data = await fs.readFile("./test/lib/RRMapParser/FW1886_with_goto_target.bin");
        let expected = JSON.parse(await fs.readFile("./test/lib/RRMapParser/FW1886_with_goto_target.json", { encoding: "utf-8" }));

        let actual = RRMapParser.PARSE(data);

        actual.image.position.should.deepEqual(expected.image.position, "position");
        actual.image.dimensions.should.deepEqual(expected.image.dimensions, "dimensions");
        actual.image.pixels.should.deepEqual(expected.image.pixels, "pixels");
        actual.path.should.deepEqual(expected.path, "path");
        actual.charger.should.deepEqual(expected.charger, "charger");
        actual.robot.should.deepEqual(expected.robot, "robot");
        should.deepEqual(actual.goto_target, expected.goto_target, "goto_target");
        should.not.exists(actual.currently_cleaned_zones, "currently_cleaned_zones");
        should.not.exists(actual.no_go_areas, "no_go_areas");
        should.not.exists(actual.virtual_walls, "virtual_walls");
        actual.should.deepEqual(expected, "full");
    });

    it("should parse map with forbidden_zones,virtual_walls,currently_cleaned_zones from firmware 2008 correctly", async function() {
        let data = await fs.readFile("./test/lib/RRMapParser/FW2008_with_forbidden_zones_and_virtual_walls_and_currently_cleaned_zones.bin");
        let expected = JSON.parse(await fs.readFile("./test/lib/RRMapParser/FW2008_with_forbidden_zones_and_virtual_walls_and_currently_cleaned_zones.json", { encoding: "utf-8" }));

        let actual = RRMapParser.PARSE(data);

        actual.image.position.should.deepEqual(expected.image.position, "position");
        actual.image.dimensions.should.deepEqual(expected.image.dimensions, "dimensions");
        actual.image.pixels.should.deepEqual(expected.image.pixels, "pixels");
        actual.path.should.deepEqual(expected.path, "path");
        actual.charger.should.deepEqual(expected.charger, "charger");
        actual.robot.should.deepEqual(expected.robot, "robot");
        should.not.exists(actual.goto_target, "goto_target");
        should.deepEqual(actual.currently_cleaned_zones, expected.currently_cleaned_zones, "currently_cleaned_zones");
        should.deepEqual(actual.no_go_areas, expected.no_go_areas, "no_go_areas");
        should.deepEqual(actual.virtual_walls, expected.virtual_walls, "virtual_walls");
        actual.should.deepEqual(expected, "full");
    });
});
