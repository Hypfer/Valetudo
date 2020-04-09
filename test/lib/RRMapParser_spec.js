const fs =  require("fs").promises;
require("should");

const RRMapParser = require("../../lib/RRMapParser");

describe("RRMapParser", function () {
    it("should parse map from firmware 1886 correctly", async function() {
        let data = await fs.readFile("./test/lib/RRMapParser/FW1886.bin");
        let expected = JSON.parse(await fs.readFile("./test/lib/RRMapParser/FW1886.json", { encoding: "utf-8" }));

        let actual = RRMapParser.PARSE(data);

        actual.image.position.should.deepEqual(expected.image.position);
        actual.image.dimensions.should.deepEqual(expected.image.dimensions);
        actual.image.pixels.should.deepEqual(expected.image.pixels);
        actual.path.should.deepEqual(expected.path);
        actual.charger.should.deepEqual(expected.charger);
        actual.robot.should.deepEqual(expected.robot);
        actual.should.deepEqual(expected);
    });
});
