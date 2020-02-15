const fs = require("fs");
const DEFAULT_MAP = require("./res/default_map");
const Vacuum = require("./miio/Vacuum");
const Dummycloud = require("./miio/Dummycloud");
const Webserver = require("./webserver/WebServer");
const MqttClient = require("./MqttClient");
const Configuration = require("./Configuration");
const MapDTO = require("./dtos/MapDTO");
const EventEmitter = require("events");
const SSHManager = require("./SSHManager");
const Logger = require("./Logger");

const Valetudo = function() {
    this.configuration = new Configuration();
    this.address = process.env.VAC_ADDRESS ? process.env.VAC_ADDRESS : "127.0.0.1";
    this.events = new EventEmitter(); //TODO: Better naming?
    this.model = Valetudo.VACUUM_MODEL_PROVIDER();

    if(process.env.VAC_TOKEN) {
        this.tokenProvider = function() {
            return Buffer.from(process.env.VAC_TOKEN, "hex");
        };
    } else {
        this.tokenProvider = Valetudo.NATIVE_TOKEN_PROVIDER;
    }

    try {
        Logger.LogLevel = this.configuration.get("logLevel");
    } catch (e) {
        Logger.error(e);
    }

    this.webPort = process.env.VAC_WEBPORT ? parseInt(process.env.VAC_WEBPORT) : 80;
    this.map = new MapDTO({
        parsedData: DEFAULT_MAP
    });

    this.dummycloud = new Dummycloud({
        spoofedIP: this.configuration.get("dummycloud").spoofedIP,
        cloudKey: Valetudo.CLOUD_KEY_PROVIDER(),
        deviceId: Valetudo.DEVICE_ID_PROVIDER(),
        bindIP: this.configuration.get("dummycloud").bindIP,
        mapUploadHost: this.configuration.get("map_upload_host"),
        events: this.events
    });

    this.vacuum = new Vacuum({
        ip: this.address,
        tokenProvider: this.tokenProvider,
        model: this.model,
        events: this.events,
        configuration: this.configuration,
    });

    this.sshManager = new SSHManager();

    this.webserver = new Webserver({
        vacuum: this.vacuum,
        port: this.webPort,
        configuration: this.configuration,
        events: this.events,
        map: this.map,
        sshManager: this.sshManager,
    });


    if(this.configuration.get("mqtt") && this.configuration.get("mqtt").enabled === true) {
        Logger.info("mqtt start");
        this.mqttClient = new MqttClient({
            configuration: this.configuration,
            vacuum: this.vacuum,
            events: this.events,
            map: this.map
        });
    }
};

function readValueFromDeviceConf(key) {
    let deviceConf;
    try {
        deviceConf = fs.readFileSync("/mnt/default/device.conf");
    } catch(e) {
        Logger.error(e);
    }

    if(deviceConf) {
        const value = deviceConf.toString().match(new RegExp("^"+ key + "=(.*)$", "m"));

        if(Array.isArray(value) && value[1]) {
            // noinspection JSConstructorReturnsPrimitive
            return value[1];
        } else {
            Logger.error("Failed to fetch " + key + " from device.conf");
        }
    } else {
        Logger.error("Failed to read device.conf");
    }
}

Valetudo.NATIVE_TOKEN_PROVIDER = function() {
    const token = fs.readFileSync("/mnt/data/miio/device.token");
    if(token && token.length >= 16) {
        return token.slice(0,16);
    } else {
        throw new Error("Unable to fetch token");
    }
};

Valetudo.CLOUD_KEY_PROVIDER = function() {
    if(process.env.VAC_CLOUDKEY) {
        // noinspection JSConstructorReturnsPrimitive
        return process.env.VAC_CLOUDKEY;
    } else {
        const cloudKey = readValueFromDeviceConf("key");

        // noinspection JSConstructorReturnsPrimitive
        return cloudKey ? cloudKey : "0000000000000000"; //This doesnt work but it wont crash the system
    }
};

Valetudo.DEVICE_ID_PROVIDER = function() { //TODO: merge with CLOUD_KEY_PROVIDER
    if(process.env.VAC_DID) {
        // noinspection JSConstructorReturnsPrimitive
        return process.env.VAC_DID;
    } else {
        const did = readValueFromDeviceConf("did");

        // noinspection JSConstructorReturnsPrimitive
        return did ? did: "00000000"; //This doesnt work but it wont crash the system
    }
};

Valetudo.VACUUM_MODEL_PROVIDER = function() {
    if(process.env.VAC_MODEL) {
        return process.env.VAC_MODEL;
    } else {
        const model = readValueFromDeviceConf("model");

        return model ? model : "rockrobo.vacuum.v1";
    }
};

Valetudo.prototype.shutdown = async function() {
    Logger.info("Valetudo shutdown in progress...");

    // shuts down valetudo (reverse startup sequence):
    if(this.mqttClient) {
        await this.mqttClient.shutdown();
    }
    await this.webserver.shutdown();
    await this.vacuum.shutdown();
    await this.dummycloud.shutdown();

    Logger.info("Valetudo shutdown done");
};

module.exports = Valetudo;
