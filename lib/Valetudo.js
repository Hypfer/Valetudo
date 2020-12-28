const v8 = require("v8");
const Webserver = require("./webserver/WebServer");
const MqttClient = require("./mqtt/MqttClient");
const Configuration = require("./Configuration");
const Logger = require("./Logger");

const ValetudoRobotFactory = require("./core/ValetudoRobotFactory");

class Valetudo {
    constructor() {
        this.config = new Configuration();

        try {
            Logger.LogLevel = this.config.get("logLevel");
        } catch (e) {
            Logger.error("Initialising Logger: " + e);
        }

        try {
            const robotImplementation = ValetudoRobotFactory.getRobotImplementation(this.config);

            // noinspection JSValidateTypes
            this.robot = new robotImplementation({
                config: this.config
            });
        } catch (e) {
            Logger.error("Error while initializing robot implementation. Shutting down ", e);

            return process.exit(1);
        }

        Logger.info("Starting Valetudo for " + this.robot.getManufacturer() + " " + this.robot.getModelName() + " (" + this.robot.constructor.name + ")");
        Logger.info("JS Runtime Version " + process.version);
        Logger.info("Max Heap Size: " + v8.getHeapStatistics().heap_size_limit/1024/1024 + " MiB");
        Logger.info("Node Flags: " + process.execArgv.join(" "));

        this.robot.startup();

        this.webserver = new Webserver({
            config: this.config,
            robot: this.robot
        });


        this.mqttClient = new MqttClient({
            config: this.config,
            robot: this.robot
        });


        //This might get refactored if there are more of these options
        if (this.config.get("debug") && typeof this.config.get("debug").memoryStatInterval === "number") {
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
            }, this.config.get("debug").memoryStatInterval);
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
        await this.robot.shutdown();

        Logger.info("Valetudo shutdown done");
        clearTimeout(forceShutdownTimeout);
    }
}

module.exports = Valetudo;
