const fs = require("fs").promises;
const path = require("path");
const should = require("should");

const ThreeIRobotixMapParser = require("../../../../lib/robots/3irobotix/ThreeIRobotixMapParser");

should.config.checkProtoEql = false;

describe("ThreeIRobotixMapParser", function () {
    it("Should pre-process & parse viomi v7 fw 47 map with currently cleaned segments", async function() {
        let data = await fs.readFile(path.join(__dirname, "/res/map/viomi_v7_47_cleaned_segment_ids.bin"));
        let expected = JSON.parse(await fs.readFile(path.join(__dirname, "/res/map/viomi_v7_47_cleaned_segment_ids.json"), { encoding: "utf-8" }));
        const preprocessedData = await ThreeIRobotixMapParser.PREPROCESS(data);

        const actual = ThreeIRobotixMapParser.PARSE(preprocessedData);

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

    it("Should pre-process & parse viomi v6 fw 41 map with virtual restrictions and active zones ", async function() {
        let data = await fs.readFile(path.join(__dirname, "/res/map/viomi_v6_41_virtual_restrictions_and_active_zones.bin"));
        let expected = JSON.parse(await fs.readFile(path.join(__dirname, "/res/map/viomi_v6_41_virtual_restrictions_and_active_zones.json"), { encoding: "utf-8" }));
        const preprocessedData = await ThreeIRobotixMapParser.PREPROCESS(data);

        const actual = ThreeIRobotixMapParser.PARSE(preprocessedData);

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

    it("Should pre-process & parse viomi v6 fw 41 map with no path", async function() {
        let data = await fs.readFile(path.join(__dirname, "/res/map/viomi_v6_41_no_path.bin"));
        let expected = JSON.parse(await fs.readFile(path.join(__dirname, "/res/map/viomi_v6_41_no_path.json"), { encoding: "utf-8" }));
        const preprocessedData = await ThreeIRobotixMapParser.PREPROCESS(data);

        const actual = ThreeIRobotixMapParser.PARSE(preprocessedData);

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

    it("Should pre-process & ignore viomi v6 fw 41 map with no unique map id and no pixels", async function() {
        let data = await fs.readFile(path.join(__dirname, "/res/map/viomi_v6_41_no_uniquemapid.bin"));
        const preprocessedData = await ThreeIRobotixMapParser.PREPROCESS(data);

        const actual = ThreeIRobotixMapParser.PARSE(preprocessedData);


        should(actual).equal(null);
    });

    it("Should pre-process & parse conga 3290 converted to viomi v6 fw 41 map with no unique map id but with pixels", async function() {
        let data = await fs.readFile(path.join(__dirname, "/res/map/converted_3290_no_id.bin"));
        let expected = JSON.parse(await fs.readFile(path.join(__dirname, "/res/map/converted_3290_no_id.json"), { encoding: "utf-8" }));
        const preprocessedData = await ThreeIRobotixMapParser.PREPROCESS(data);

        const actual = ThreeIRobotixMapParser.PARSE(preprocessedData);


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

    it("Should pre-process & parse conga 3290 converted to viomi v6 fw 41 map with no unique map id but with segment pixels", async function() {
        let data = await fs.readFile(path.join(__dirname, "/res/map/converted_3290_noid_segments.bin"));
        let expected = JSON.parse(await fs.readFile(path.join(__dirname, "/res/map/converted_3290_noid_segments.json"), { encoding: "utf-8" }));
        const preprocessedData = await ThreeIRobotixMapParser.PREPROCESS(data);

        const actual = ThreeIRobotixMapParser.PARSE(preprocessedData);


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

    it("Should pre-process & parse conga 3790 converted to viomi v6 fw 41 map", async function() {
        let data = await fs.readFile(path.join(__dirname, "/res/map/converted_3790.bin"));
        let expected = JSON.parse(await fs.readFile(path.join(__dirname, "/res/map/converted_3790.json"), { encoding: "utf-8" }));
        const preprocessedData = await ThreeIRobotixMapParser.PREPROCESS(data);

        const actual = ThreeIRobotixMapParser.PARSE(preprocessedData);


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
