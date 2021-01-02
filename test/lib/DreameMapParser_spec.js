const fs = require("fs").promises;
const should = require("should");

const DreameMapParser = require("../../lib/DreameMapParser");

should.config.checkProtoEql = false;

describe("DreameMapParser", function () {
    it("Should parse D9 FW 1058 no-segment map correctly", async function() {
        let data = await fs.readFile("./test/lib/DreameMapParser/d9_1058_no_segments.bin");
        let expected = JSON.parse(await fs.readFile("./test/lib/DreameMapParser/d9_1058_no_segments.json", { encoding: "utf-8" }));

        let actual = DreameMapParser.PARSE(data);

        actual.layers.length.should.equal(expected.layers.length, "layerCount");

        actual.layers.forEach((layer, i) => {
            actual.layers[i].should.deepEqual(expected.layers[i]);
        });

        actual.entities.length.should.equal(expected.entities.length, "entitiesCount");

        actual.entities.forEach((layer, i) => {
            actual.entities[i].should.deepEqual(expected.entities[i]);
        });

        actual.should.deepEqual(expected);
    });


    it("Should parse D9 FW 1058 segment map correctly", async function() {
        let data = await fs.readFile("./test/lib/DreameMapParser/d9_1058_with_segments.bin");
        let expected = JSON.parse(await fs.readFile("./test/lib/DreameMapParser/d9_1058_with_segments.json", { encoding: "utf-8" }));

        let actual = DreameMapParser.PARSE(data);

        actual.layers.length.should.equal(expected.layers.length, "layerCount");

        actual.layers.forEach((layer, i) => {
            actual.layers[i].should.deepEqual(expected.layers[i]);
        });

        actual.entities.length.should.equal(expected.entities.length, "entitiesCount");

        actual.entities.forEach((layer, i) => {
            actual.entities[i].should.deepEqual(expected.entities[i]);
        });

        actual.should.deepEqual(expected);
    });

});
