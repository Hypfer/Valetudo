/**
 * Run the viomiMapParser on the supplied filename.
 * Example usage: nodejs viomi_manual_map_parser.js /tmp/mapdata
 */
const {readFileSync} = require("fs");
const {inflateSync} = require("zlib");
const ViomiMapParser = require("../lib/robots/viomi/ViomiMapParser");
const Logger = require("../lib/Logger");

Logger.LogLevel = "trace";
let binary = readFileSync(process.argv[2]);
binary = inflateSync(binary);
let parser = new ViomiMapParser(binary);
parser.parse();
