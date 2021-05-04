import swaggerJsdoc from "swagger-jsdoc";
import SwaggerParser from "swagger-parser";
import Tools from "../lib/Tools.js";
import * as fs from "fs";
import * as path from "path";
import {URL} from "url";

const __dirname = new URL(".", import.meta.url).pathname;

process.on("uncaughtException", function (err) {
    // eslint-disable-next-line no-console
    console.log(err);
    process.exit(1);
});

const options = {
    failOnErrors: false,
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Valetudo REST API",
            version: Tools.GET_VALETUDO_VERSION()
        },
        tags: [
            {name: "valetudo", description: "Valetudo management API"},
            {name: "robot", description: "Robot API"},
            {name: "BasicControlCapability", description: "Basic control capability"},
            {name: "PresetSelectionCapability", description: "Preset selection capability (fan speed, water grade)"},
        ],
        components: {
            responses: {
                "200": {description: "Ok"},
                "201": {description: "Created"},
                "202": {description: "Accepted"},
                "400": {description: "Bad request"},
                "403": {description: "Forbidden"},
            },
            parameters: {
                presetCapability: {
                    in: "path",
                    name: "presetCapability",
                    required: true,
                    description: "Preset selection capability implementation",
                    schema: {
                        type: "string",
                        enum: [
                            "FanSpeedControlCapability",
                            "WaterUsageControlCapability"
                        ]
                    }
                }
            }
        }
    },
    apis: [
        path.join(__dirname, "../util/swagger_defs/*.yml"),
        path.join(__dirname, "../lib/webserver/*.js"),
        path.join(__dirname, "../lib/webserver/capabilityRouters/*.js"),
        path.join(__dirname, "../lib/webserver/middlewares/*.js"),
        path.join(__dirname, "../lib/entities/map/*.js"),
    ]
};

const spec = await swaggerJsdoc(options);
await SwaggerParser.validate(spec);

fs.writeFileSync(
    path.join(__dirname, "../lib/res/swagger.json"),
    JSON.stringify(spec)
);


