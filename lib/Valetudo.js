

const fs = require("fs");
const dgram = require("dgram");
const DEFAULT_MAP = require("./res/default_map");
const Dummycloud = require("./miio/Dummycloud");
const Webserver = require("./webserver/WebServer");
const MqttClient = require("./MqttClient");
const Configuration = require("./Configuration");
const MapDTO = require("./dtos/MapDTO");
const EventEmitter = require('events');
const SSHManager = require('./SSHManager');
const Model = require("./miio/Model");
const MiioSocket = require("./miio/MiioSocket");
const MiioDevice = require("./devices/MiioDevice");
const Viomi = require("./devices/Viomi");
const Roborock = require("./devices/Roborock");

/** @constructor */
const Valetudo = function() {
    this.configuration = new Configuration();
    this.address = process.env.VAC_ADDRESS ? process.env.VAC_ADDRESS : "127.0.0.1";
    this.events = new EventEmitter(); //TODO: Better naming?
    this.model = new Model(Valetudo.VACUUM_MODEL_PROVIDER());

    if(process.env.VAC_TOKEN) {
        this.tokenProvider = function() {
            return Buffer.from(process.env.VAC_TOKEN, "hex");
        }
    } else {
        this.tokenProvider = Valetudo.NATIVE_TOKEN_PROVIDER;
    }

    this.webPort = process.env.VAC_WEBPORT ? parseInt(process.env.VAC_WEBPORT) : 80;
    this.map = new MapDTO({
        parsedData: DEFAULT_MAP
    });

    /** @type{MiioDevice} */
    this.vacuum;

    this.dummycloud = new Dummycloud({
        spoofedIP: this.configuration.get("dummycloud").spoofedIP,
        cloudKey: Valetudo.CLOUD_KEY_PROVIDER(),
        deviceId: Valetudo.DEVICE_ID_PROVIDER(),
        bindIP: this.configuration.get("dummycloud").bindIP,
        mapUploadHost: this.configuration.get("map_upload_host"),
        events: this.events,
        onConnected: () => this.vacuum.pollMap(() => {})
    });

    const robotArgs = {
        localSocket: createLocalSocket(this.tokenProvider(), this.address),
        cloudSocket: this.dummycloud.miioSocket,
        events: this.events,
        ip: this.address,
        configuration: this.configuration,
        tokenProvider: this.tokenProvider
    };

    if (this.model.viomiApi) {
        this.vacuum = new Viomi(robotArgs);
    } else {
        this.vacuum = new Roborock(robotArgs);
    }
    this.dummycloud.onMessage = this.vacuum.onMessage.bind(this.vacuum);

    this.sshManager = new SSHManager();

    this.webserver = new Webserver({
        vacuum: this.vacuum,
        port: this.webPort,
        configuration: this.configuration,
        events: this.events,
        map: this.map,
        sshManager: this.sshManager,
        cloudKey: Valetudo.CLOUD_KEY_PROVIDER(),
    });

    if(this.configuration.get("mqtt") && this.configuration.get("mqtt").enabled === true) {
        console.log("mqtt start");
        this.mqttClient = new MqttClient({
            configuration: this.configuration,
            vacuum: this.vacuum,
            events: this.events,
            map: this.map
        });
    }
};

function createLocalSocket(token, address) {
    const socket = dgram.createSocket("udp4");
    socket.bind();

    return new MiioSocket({
        socket: socket,
        token: token,
        onMessage: null,
        deviceId: undefined,
        rinfo: {address: address, port: MiioSocket.PORT},
        timeout: undefined
    });
}

function readValueFromDeviceConf(key) {
    let deviceConf;
    for (const filename in ["/mnt/default/device.conf", "/etc/miio/device.conf"]) {
        try {
            deviceConf = fs.readFileSync(filename);
        } catch (e) {
            console.debug('cannot read', filename, e);
        }
    }

    if(deviceConf) {
        const value = deviceConf.toString().match(new RegExp("^"+ key + "=(.*)$", "m"));

        if(Array.isArray(value) && value[1]) {
            // noinspection JSConstructorReturnsPrimitive
            return value[1];
        } else {
            console.error("Failed to fetch " + key + " from device.conf");
        }
    } else {
        console.error("Failed to read device.conf");
    }
}

Valetudo.NATIVE_TOKEN_PROVIDER = function() {
    for (const filename in ["/mnt/data/miio/device.token", "/etc/miio/device.token"]) {
        let token;
        try {
            token = fs.readFileSync(filename);
        } catch (e) {
            console.debug('cannot read', filename, e);
        }
        if (token && token.length >= 16) {
            return token.slice(0, 16);
        }
    }
    throw new Error("Unable to fetch token");
};

Valetudo.CLOUD_KEY_PROVIDER = function() {
    if(process.env.VAC_CLOUDKEY) {
        return Buffer.from(process.env.VAC_CLOUDKEY);
    } else {
        const cloudKey = readValueFromDeviceConf("key");
        return Buffer.from(
            cloudKey ? cloudKey
                     : "0000000000000000" // This doesnt work but it wont crash the system
        );
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
    console.info("Valetudo shutdown in progress...")

    // shuts down valetudo (reverse startup sequence):
    if(this.mqttClient) {
        await this.mqttClient.shutdown()
    }
    await this.webserver.shutdown();
    await this.vacuum.shutdown();
    await this.dummycloud.shutdown();

    console.info("Valetudo shutdown done");
};

module.exports = Valetudo;
