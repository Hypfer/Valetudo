import swaggerJsdoc from "swagger-jsdoc";
import SwaggerParser from "swagger-parser";
import Tools from "../backend/lib/Tools.js";
import * as fs from "fs";
import * as path from "path";
const __dirname = path.resolve();

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
            {name: "system", description: "System API"},
            {name: "ntp", description: "NTP Client API"},

            {name: "BasicControlCapability", description: "Basic control capability"},
            {name: "PresetSelectionCapability", description: "Preset selection capability (fan speed, water grade)"},
            {name: "WifiConfigurationCapability", description: "Wi-Fi configuration capability"},
            {name: "ZoneCleaningCapability", description: "Zone cleaning capability"},
            {name: "MapSegmentationCapability", description: "Map segment cleaning capability"},
            {name: "ManualControlCapability", description: "Manual control capability"},
            {name: "DoNotDisturbCapability", description: "Do-not-disturb configuration capability"},
            {name: "ConsumableMonitoringCapability", description: "Consumable monitoring capability"},
            {name: "LocateCapability", description: "Robot locate capability"},
            {name: "GoToLocationCapability", description: "Go-to location capability"},
            {name: "CarpetModeControlCapability", description: "Carpet mode settings capability"},
            {name: "MapResetCapability", description: "Map reset capability"},
            {name: "MapSegmentEditCapability", description: "Map segment edit capability"},
            {name: "MapSegmentRenameCapability", description: "Map segment rename capability"},
            {name: "MapSnapshotCapability", description: "Map snapshots capability"},
            {name: "PersistentMapControlCapability", description: "Persistent map control capability"},
            {name: "SensorCalibrationCapability", description: "Sensor calibration capability"},
            {name: "SpeakerTestCapability", description: "Speaker test capability"},
            {name: "SpeakerVolumeControlCapability", description: "Speaker volume control capability"},
            {name: "VoicePackManagementCapability", description: "Voice pack management capability"},
            {name: "CombinedVirtualRestrictionsCapability", description: "Combined virtual restrictions capability"},
        ],
        components: {
            responses: {
                "200": {description: "Ok"},
                "201": {description: "Created"},
                "202": {description: "Accepted"},
                "400": {description: "Bad request"},
                "403": {description: "Forbidden"},
                "404": {description: "Not found"},
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
            },
            securitySchemes: {
                BasicAuth: {
                    type: "http",
                    scheme: "basic"
                }
            }
        },
        security: [
            {BasicAuth: []}
        ],
    },
    apis: [
        path.join(__dirname, "./backend/util/swagger_defs/*.swagger.json"),
        path.join(__dirname, "./backend/lib/webserver/doc/*.swagger.json"),
        path.join(__dirname, "./backend/lib/webserver/capabilityRouters/doc/*.swagger.json"),
        path.join(__dirname, "./backend/lib/webserver/middlewares/doc/*.swagger.json"),
        path.join(__dirname, "./backend/lib/entities/doc/*.swagger.json"),
        path.join(__dirname, "./backend/lib/entities/map/doc/*.swagger.json"),
        path.join(__dirname, "./backend/lib/entities/core/doc/*.swagger.json"),
        path.join(__dirname, "./backend/lib/entities/core/ntpClient/doc/*.swagger.json"),
        path.join(__dirname, "./backend/lib/entities/state/doc/*.swagger.json"),
        path.join(__dirname, "./backend/lib/entities/state/attributes/doc/*.swagger.json"),
        path.join(__dirname, "./backend/lib/core/capabilities/doc/*.swagger.json")
    ]
};

const spec = await swaggerJsdoc(options);

await SwaggerParser.validate(spec);


fs.writeFileSync(
    path.join(__dirname, "./backend/lib/res/swagger.json"),
    JSON.stringify(spec)
);


