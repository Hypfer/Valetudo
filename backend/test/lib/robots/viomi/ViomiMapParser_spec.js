const fs = require("fs").promises;
const path = require("path");
const should = require("should");

const ViomiMapParser = require("../../../../lib/robots/viomi/ViomiMapParser");

should.config.checkProtoEql = false;

describe("ViomiMapParser", function () {
    it("Should pre-process & parse v7 fw 47 map with currently cleaned segments", async function() {
        let data = await fs.readFile(path.join(__dirname, "/res/map/v7_47_cleaned_segment_ids.bin"));
        let expected = JSON.parse(await fs.readFile(path.join(__dirname, "/res/map/v7_47_cleaned_segment_ids.json"), { encoding: "utf-8" }));
        const parserInstance = new ViomiMapParser(await ViomiMapParser.PREPROCESS(data));
        let actual = parserInstance.parse();

        if (actual.metaData?.nonce) {
            delete(actual.metaData.nonce);
        }

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
