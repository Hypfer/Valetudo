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
        should.not.exists(actual.forbidden_zones, "forbidden_zones");
        should.not.exists(actual.virtual_walls, "virtual_walls");
        actual.should.deepEqual(expected, "full");
    });
});
