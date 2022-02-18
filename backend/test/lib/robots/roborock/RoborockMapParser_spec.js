const fs = require("fs").promises;
const path = require("path");
const should = require("should");

const RoborockMapParser = require("../../../../lib/robots/roborock/RoborockMapParser");

should.config.checkProtoEql = false;

describe("RoborockMapParser", function () {
    it("should not parse random junk", async function() {
        let data = Buffer.allocUnsafe(64);
        let actual = RoborockMapParser.PARSE(data);

        should(actual).equal(null);
    });

    it("should parse s5 map without extra data from firmware 1886 correctly", async function() {

        let data = await fs.readFile(path.join(__dirname, "/res/map/S5_FW1886_without_extra_data.bin"));
        let expected = JSON.parse(await fs.readFile(path.join(__dirname, "/res/map/S5_FW1886_without_extra_data.json"), { encoding: "utf-8" }));

        let actual = RoborockMapParser.PARSE(data);

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

    it("should parse s5 map with forbidden_zones,virtual_walls,currently_cleaned_zones from firmware 1886 correctly", async function() {
        let data = await fs.readFile(path.join(__dirname, "/res/map/S5_FW1886_with_forbidden_zones_and_virtual_walls_and_currently_cleaned_zones.bin"));
        let expected = JSON.parse(await fs.readFile(path.join(__dirname, "/res/map/S5_FW1886_with_forbidden_zones_and_virtual_walls_and_currently_cleaned_zones.json"), { encoding: "utf-8" }));

        let actual = RoborockMapParser.PARSE(data);

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

    it("should parse s5 map with goto_target from firmware 1886 correctly", async function() {
        let data = await fs.readFile(path.join(__dirname, "/res/map/S5_FW1886_with_goto_target.bin"));
        let expected = JSON.parse(await fs.readFile(path.join(__dirname, "/res/map/S5_FW1886_with_goto_target.json"), { encoding: "utf-8" }));

        let actual = RoborockMapParser.PARSE(data);

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

    it("should parse s5 map with forbidden_zones,virtual_walls,currently_cleaned_zones from firmware 2008 correctly", async function() {
        let data = await fs.readFile(path.join(__dirname, "/res/map/S5_FW2008_with_forbidden_zones_and_virtual_walls_and_currently_cleaned_zones.bin"));
        let expected = JSON.parse(await fs.readFile(path.join(__dirname, "/res/map/S5_FW2008_with_forbidden_zones_and_virtual_walls_and_currently_cleaned_zones.json"), { encoding: "utf-8" }));

        let actual = RoborockMapParser.PARSE(data);

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

    it("should parse s5 map with segments from firmware 2008 correctly", async function() {
        let data = await fs.readFile(path.join(__dirname, "/res/map/S5_FW2008_with_segments.bin"));
        let expected = JSON.parse(await fs.readFile(path.join(__dirname, "/res/map/S5_FW2008_with_segments.json"), { encoding: "utf-8" }));

        let actual = RoborockMapParser.PARSE(data);

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

    it("should parse s5 map with segments from firmware 2020 correctly", async function() {
        let data = await fs.readFile(path.join(__dirname, "/res/map/S5_FW2020_with_segments.bin"));
        let expected = JSON.parse(await fs.readFile(path.join(__dirname, "/res/map/S5_FW2020_with_segments.json"), { encoding: "utf-8" }));

        let actual = RoborockMapParser.PARSE(data);

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

    it("should parse s6 map with segments from firmware 2652 with active segments and no-mop-zones correctly", async function() {
        let data = await fs.readFile(path.join(__dirname, "/res/map/S6_FW2652_with_active_segment_and_no_mop_zone.bin"));
        let expected = JSON.parse(await fs.readFile(path.join(__dirname, "/res/map/S6_FW2652_with_active_segment_and_no_mop_zone.json"), { encoding: "utf-8" }));

        let actual = RoborockMapParser.PARSE(data);

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
