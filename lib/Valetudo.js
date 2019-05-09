const fs = require("fs");
const Vacuum = require("./miio/Vacuum");
const Dummycloud = require("./miio/Dummycloud");
const Webserver = require("./webserver/WebServer");
const MqttClient = require("./MqttClient");
const Configuration = require("./Configuration");
const MapDTO = require("./dtos/MapDTO");
const EventEmitter = require('events');
const SSHManager = require('./SSHManager');

const Valetudo = function() {
    this.configuration = new Configuration();
    this.address = process.env.VAC_ADDRESS ? process.env.VAC_ADDRESS : "127.0.0.1";
    this.events = new EventEmitter(); //TODO: Better naming?

    if(process.env.VAC_TOKEN) {
        this.tokenProvider = function() {
            return Buffer.from(process.env.VAC_TOKEN, "hex");
        }
    } else {
        this.tokenProvider = Valetudo.NATIVE_TOKEN_PROVIDER;
    }

    this.webPort = process.env.VAC_WEBPORT ? parseInt(process.env.VAC_WEBPORT) : 80;
    this.map = new MapDTO({
        parsedData: { //An empty but valid map
            "map_index": 0,
            "map_sequence": 0,
            "image": {
                "position": {
                    "top": 511,
                    "left": 511
                },
                "dimensions": {
                    "height": 1,
                    "width": 1
                },
                "pixels": {
                    "floor": [],
                    "obstacle_weak": [],
                    "obstacle_strong": []
                }
            },
            "path": {
                "current_angle": 0,
                "points": []
            },
            "charger": [25600, 25600],
            "robot": [25600, 25600]
        }
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
        tokenProvider: this.tokenProvider
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
        this.mqttClient = new MqttClient({
            configuration: this.configuration,
            vacuum: this.vacuum,
            events: this.events,
            map: this.map
        });
    }
};

Valetudo.NATIVE_TOKEN_PROVIDER = function() {
    const token = fs.readFileSync("/mnt/data/miio/device.token");
    if(token && token.length >= 16) {
        return token.slice(0,16);
    } else {
        throw new Error("Unable to fetch token")
    }
};

Valetudo.CLOUD_KEY_PROVIDER = function() {
    if(process.env.VAC_CLOUDKEY) {
        // noinspection JSConstructorReturnsPrimitive
        return process.env.VAC_CLOUDKEY;
    } else {
        let deviceConf;
        try {
            deviceConf = fs.readFileSync("/mnt/default/device.conf");
        } catch(e) {
            console.error(e);
        }

        if(deviceConf) {
            const key = deviceConf.toString().match(/^key=(.*)$/m);

            if(Array.isArray(key) && key[1]) {
                // noinspection JSConstructorReturnsPrimitive
                return key[1];
            } else {
                console.error("Failed to fetch cloudKey");
            }
        } else {
            console.error("Failed to read device.conf");
        }

        // noinspection JSConstructorReturnsPrimitive
        return "0000000000000000"; //This doesnt work but it wont crash the system
    }
};

Valetudo.DEVICE_ID_PROVIDER = function() { //TODO: merge with CLOUD_KEY_PROVIDER
    if(process.env.VAC_DID) {
        // noinspection JSConstructorReturnsPrimitive
        return process.env.VAC_DID;
    } else {
        let deviceConf;
        try {
            deviceConf = fs.readFileSync("/mnt/default/device.conf");
        } catch(e) {
            console.error(e);
        }

        if(deviceConf) {
            const did = deviceConf.toString().match(/^did=(.*)$/m);

            if(Array.isArray(did) && did[1]) {
                // noinspection JSConstructorReturnsPrimitive
                return did[1];
            } else {
                console.error("Failed to fetch DID");
            }
        } else {
            console.error("Failed to read device.conf");
        }

        // noinspection JSConstructorReturnsPrimitive
        return "00000000"; //This doesnt work but it wont crash the system
    }
};

module.exports = Valetudo;
