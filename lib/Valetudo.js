const fs = require("fs");
const Vacuum = require("./miio/Vacuum");
const Dummycloud = require("./miio/Dummycloud");
const Webserver = require("./webserver/WebServer");
const MqttClient = require("./MqttClient");
const Configuration = require("./Configuration");

const Valetudo = function() {
    this.configuration = new Configuration();
    this.address = process.env.VAC_ADDRESS ? process.env.VAC_ADDRESS : "127.0.0.1";

    if(process.env.VAC_TOKEN) {
        this.tokenProvider = function() {
            return Buffer.from(process.env.VAC_TOKEN, "hex");
        }
    } else {
        this.tokenProvider = Valetudo.NATIVE_TOKEN_PROVIDER;
    }

    this.webPort = process.env.VAC_WEBPORT ? parseInt(process.env.VAC_WEBPORT) : 80;

    this.dummycloud = new Dummycloud({
        spoofedIP: this.configuration.get("dummycloud").spoofedIP,
        cloudKey: Valetudo.CLOUD_KEY_PROVIDER(),
        bindIP: this.configuration.get("dummycloud").bindIP
    });

    this.vacuum = new Vacuum({
        ip: this.address,
        tokenProvider: this.tokenProvider
    });

    this.webserver = new Webserver({
        vacuum: this.vacuum,
        port: this.webPort,
        configuration: this.configuration
    });


    if(this.configuration.get("mqtt") && this.configuration.get("mqtt").enabled === true) {
        this.mqttClient = new MqttClient({
            vacuum: this.vacuum,
            brokerURL: this.configuration.get("mqtt").broker_url,
            identifier: this.configuration.get("mqtt").identifier,
            topicPrefix: this.configuration.get("mqtt").topicPrefix,
            autoconfPrefix: this.configuration.get("mqtt").autoconfPrefix,
            mapSettings: this.configuration.get("mqtt").mapSettings,
            mapUpdateInterval: this.configuration.get("mqtt").mapUpdateInterval,
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
            }
        }

        // noinspection JSConstructorReturnsPrimitive
        return "0000000000000000"; //This doesnt work but it wont crash the system
    }
};

module.exports = Valetudo;
