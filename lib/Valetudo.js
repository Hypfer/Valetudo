const fs = require("fs");
const DEFAULT_MAP = require("./res/default_map.json");
const Webserver = require("./webserver/WebServer");
const MqttClient = require("./MqttClient");
const Configuration = require("./Configuration");
const MapDTO = require("./dtos/MapDTO");
const Events = require("./Events");
const SSHManager = require("./SSHManager");
const Model = require("./miio/Model");
const Logger = require("./Logger");
const Viomi = require("./devices/Viomi");
const RoborockV1 = require("./devices/RoborockV1");
const RoborockS5 = require("./devices/RoborockS5");

class Valetudo {
    constructor() {
        this.configuration = new Configuration();
        this.address = process.env.VAC_ADDRESS ? process.env.VAC_ADDRESS : "127.0.0.1";
        this.events = new Events();
        this.model = new Model(Valetudo.VACUUM_MODEL_PROVIDER());
        this.tokenProvider = Valetudo.NATIVE_TOKEN_PROVIDER;

        try {
            Logger.LogLevel = this.configuration.get("logLevel");
        } catch (e) {
            Logger.error("Initialising Logger: " + e);
        }

        this.webPort = process.env.VAC_WEBPORT ? parseInt(process.env.VAC_WEBPORT) : 80;
        this.map = new MapDTO({
            parsedData: DEFAULT_MAP
        });

        /** @type {import("./devices/MiioVacuum")} */
        this.vacuum;

        const robotArgs = {
            events: this.events,
            ip: this.address,
            configuration: this.configuration,
            model: this.model,
            tokenProvider: this.tokenProvider,
            cloudKey: Valetudo.CLOUD_KEY_PROVIDER(),
            deviceId: Valetudo.DEVICE_ID_PROVIDER(),
        };

        Logger.info("Starting Valetudo for Vacuum Model " + (this.model ? this.model.getModelIdentifier() : "UNKNOWN"));
        Logger.info("DID " + robotArgs.deviceId);
        Logger.info("CloudKey " + robotArgs.cloudKey);

        if (MODEL_TO_IMPLEMENTATION[this.model.getModelIdentifier()]) {
            this.vacuum = new MODEL_TO_IMPLEMENTATION[this.model.getModelIdentifier()](robotArgs);
        } else {
            throw new Error("No implementation found for " + this.model.getModelIdentifier());
        }

        this.sshManager = new SSHManager();

        this.webserver = new Webserver({
            vacuum: this.vacuum,
            port: this.webPort,
            configuration: this.configuration,
            events: this.events,
            map: this.map,
            model: this.model,
            sshManager: this.sshManager,
            cloudKey: Valetudo.CLOUD_KEY_PROVIDER(),
        });

        this.mqttClient = new MqttClient({
            configuration: this.configuration,
            vacuum: this.vacuum,
            model: this.model,
            events: this.events,
            map: this.map
        });
    }

    /**
     * Returns a {did: …, key:…, vendor: …, mac: …, model: …} object.
     *
     * @private
     */
    static readDeviceConf() {
        let deviceConf;
        const deviceConfFiles =
            ["develop/local/device.conf", "/mnt/default/device.conf", "/etc/miio/device.conf"];
        const filename = deviceConfFiles.filter(fs.existsSync)[0];
        if (!filename) {
            Logger.error("Could not find a device.conf file in ", deviceConfFiles);
        } else {
            try {
                deviceConf = fs.readFileSync(filename);
            } catch (e) {
                Logger.warn("cannot read", filename, e);
            }
        }

        let result = {};
        if (deviceConf) {
            deviceConf.toString().split(/\n/).map(line => line.split(/=/, 2)).map(([k, v]) => result[k] = v);
        }
        if (!result["did"] || !result["key"] || !result["model"]) {
            Logger.error("Failed to read device.conf");
        }
        return result;
    }

    static NATIVE_TOKEN_PROVIDER() {
        const tokenFiles =
            ["develop/local/device.token", "/mnt/data/miio/device.token", "/etc/miio/device.token"];
        const filename = tokenFiles.filter(fs.existsSync)[0];
        if (!filename) {
            Logger.error("Could not find a device.token file in ", tokenFiles);
        } else {
            let line;
            try {
                line = fs.readFileSync(filename);
            } catch (e) {
                Logger.debug("cannot read", filename, e);
            }
            if (line && line.length >= 32) {
                // For local development, people might put in the hex representation of the token.
                // Make this work too.
                return Buffer.from(line.toString().slice(0, 32), "hex");
            }
            if (line && line.length >= 16) {
                return line.slice(0, 16);
            }
        }
        throw new Error("Unable to fetch token");
    }

    static CLOUD_KEY_PROVIDER() {
        const cloudKey = this.readDeviceConf()["key"];
        return Buffer.from(
            cloudKey ? cloudKey : "0000000000000000" // This doesnt work but it wont crash the system
        );
    }

    /** @returns {number} */
    static DEVICE_ID_PROVIDER() { //TODO: merge with CLOUD_KEY_PROVIDER
        const did = this.readDeviceConf()["did"];
        return did ? parseInt(did, 10) : 0;
    }

    static VACUUM_MODEL_PROVIDER() {
        const model = this.readDeviceConf()["model"];
        return model ? model : "rockrobo.vacuum.v1";
    }

    async shutdown() {
        Logger.info("Valetudo shutdown in progress...");

        const forceShutdownTimeout = setTimeout(() => {
            Logger.warn("Failed to shutdown valetudo in a timely manner. Using (the) force");
            process.exit(1);
        }, 5000);

        // shuts down valetudo (reverse startup sequence):
        if (this.mqttClient) {
            await this.mqttClient.shutdown();
        }
        await this.webserver.shutdown();
        await this.vacuum.shutdown();

        Logger.info("Valetudo shutdown done");
        clearTimeout(forceShutdownTimeout);
    }
}

const MODEL_TO_IMPLEMENTATION = {
    "rockrobo.vacuum.v1": RoborockV1,
    "roborock.vacuum.s5": RoborockS5,
    "viomi.vacuum.v7": Viomi
};

module.exports = Valetudo;
