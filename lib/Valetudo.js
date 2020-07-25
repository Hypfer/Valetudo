const v8 = require("v8");
const Webserver = require("./webserver/WebServer");
const MqttClient = require("./MqttClient");
const Configuration = require("./Configuration");
const Events = require("./Events");
const SSHManager = require("./SSHManager");
const Model = require("./miio/Model");
const Logger = require("./Logger");
const Viomi = require("./devices/Viomi");
const RoborockV1 = require("./devices/RoborockV1");
const RoborockS5 = require("./devices/RoborockS5");
const RoborockGen3 = require("./devices/RoborockGen3");
const Dreame = require("./devices/Dreame");

class Valetudo {
    constructor() {
        this.configuration = new Configuration();
        this.events = new Events();

        try {
            Logger.LogLevel = this.configuration.get("logLevel");
        } catch (e) {
            Logger.error("Initialising Logger: " + e);
        }

        const modelConf = this.configuration.get("model");

        this.model = new Model({
            identifier: modelConf.type,
            embedded: modelConf.embedded,
            config: modelConf.config
        });

        /** @type {import("./devices/MiioVacuum")} */
        this.vacuum;

        const robotArgs = {
            events: this.events,
            configuration: this.configuration,
            model: this.model
        };

        Logger.info("Starting Valetudo for Vacuum Model " + this.model.getModelIdentifier());
        Logger.info("DeviceId " + this.model.getDeviceId());
        Logger.info("IP " + this.model.getIP());
        Logger.info("CloudSecret " + this.model.getCloudSecret());
        Logger.info("LocalSecret " + this.model.getLocalSecretProvider()());
        Logger.info("JS Runtime Version " + process.version);
        Logger.info("Max Heap Size: " + v8.getHeapStatistics().heap_size_limit/1024/1024 + " MiB");

        if (MODEL_TO_IMPLEMENTATION[this.model.getModelIdentifier()]) {
            this.vacuum = new MODEL_TO_IMPLEMENTATION[this.model.getModelIdentifier()](robotArgs);
        } else {
            throw new Error("No implementation found for " + this.model.getModelIdentifier());
        }

        this.sshManager = new SSHManager();

        this.webserver = new Webserver({
            vacuum: this.vacuum,
            configuration: this.configuration,
            events: this.events,
            model: this.model,
            sshManager: this.sshManager
        });

        this.mqttClient = new MqttClient({
            configuration: this.configuration,
            vacuum: this.vacuum,
            model: this.model,
            events: this.events
        });

        //This might get refactored if there are more of these options
        if (this.configuration.get("debug") && typeof this.configuration.get("debug").memoryStatInterval === "number") {
            this.memoryStatInterval = setInterval(() => {
                const output = {};
                const heapStatistics = v8.getHeapStatistics();

                try {
                    output.totalHeapSize = (heapStatistics.total_heap_size/1024/1024).toFixed(3) + " MiB";
                    output.mallocedMemory = (heapStatistics.malloced_memory/1024/1024).toFixed(3) + " MiB";
                    output.peakMallocedMemory = (heapStatistics.peak_malloced_memory/1024/1024).toFixed(3) + " MiB";
                } catch (e) {
                    //Intentional if something is 0
                }

                Logger.info("Memory Stats", output);
            }, this.configuration.get("debug").memoryStatInterval);
        }
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

        //Debug foo
        if (this.memoryStatInterval) {
            clearInterval(this.memoryStatInterval);
        }

        Logger.info("Valetudo shutdown done");
        clearTimeout(forceShutdownTimeout);
    }
}

const MODEL_TO_IMPLEMENTATION = {
    "rockrobo.vacuum.v1": RoborockV1,
    "roborock.vacuum.s5": RoborockS5,
    "viomi.vacuum.v6": Viomi,
    "viomi.vacuum.v7": Viomi,
    "viomi.vacuum.v8": Viomi,
    "roborock.vacuum.t6": RoborockGen3,
    "roborock.vacuum.s6": RoborockGen3,
    "roborock.vacuum.s5e": RoborockGen3,
    "roborock.vacuum.t4": RoborockGen3,
    "roborock.vacuum.s4": RoborockGen3,
    "roborock.vacuum.m1s": RoborockGen3,
    "roborock.vacuum.a10": RoborockGen3,
    "roborock.vacuum.a11": RoborockGen3,
    "roborock.vacuum.a08": RoborockGen3,
    "roborock.vacuum.p5": RoborockGen3,
    "dreame.vacuum.mc1808": Dreame
};

module.exports = Valetudo;
