const should = require("should");

const GithubValetudoUpdateProvider = require("../../../../../lib/updater/lib/update_provider/GithubValetudoUpdateProvider");
const path = require("path");
const {promises: fs} = require("fs");

should.config.checkProtoEql = false;

describe("GithubValetudoUpdateProvider", function () {
    it("Should parse regular overview response correctly", async function() {
        const updateProvider = new GithubValetudoUpdateProvider();
        const data = JSON.parse(await fs.readFile(path.join(__dirname, "/res/GithubValetudoUpdateProvider/regular_overview_response.json"), { encoding: "utf-8" }));
        const expected = JSON.parse(await fs.readFile(path.join(__dirname, "/res/GithubValetudoUpdateProvider/correctly_parsed_regular_overview_response.json"), { encoding: "utf-8" }));
        const actual = updateProvider.parseReleaseOverviewApiResponse(data);

        JSON.parse(JSON.stringify(actual)).should.deepEqual(expected);
    });

    it("Should parse incorrectly sorted overview response correctly", async function() {
        const updateProvider = new GithubValetudoUpdateProvider();
        const data = JSON.parse(await fs.readFile(path.join(__dirname, "/res/GithubValetudoUpdateProvider/incorrectly_sorted_overview_response.json"), { encoding: "utf-8" }));
        const expected = JSON.parse(await fs.readFile(path.join(__dirname, "/res/GithubValetudoUpdateProvider/correctly_parsed_regular_overview_response.json"), { encoding: "utf-8" }));
        const actual = updateProvider.parseReleaseOverviewApiResponse(data);

        JSON.parse(JSON.stringify(actual)).should.deepEqual(expected);
    });
});
