/**
 * Run the viomiMapParser on the supplied filename.
 * Example usage: nodejs viomi_manual_map_parser.js /tmp/mapdata
 */
const Logger = require("../backend/lib/Logger");
const ViomiMapParser = require("../backend/lib/robots/viomi/ViomiMapParser");
const {inflateSync} = require("zlib");
const {readFileSync} = require("fs");

Logger.LogLevel = "trace";
let binary = readFileSync(process.argv[2]);
binary = inflateSync(binary);
let parser = new ViomiMapParser(binary);
parser.parse();
