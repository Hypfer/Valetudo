const Configuration = require("./Configuration");
const Logger = require("./Logger");
const MqttController = require("./mqtt/MqttController");
const NTPClient = require("./NTPClient");
const os = require("os");
const path = require("path");
const Tools = require("./Tools");
const v8 = require("v8");
const Webserver = require("./webserver/WebServer");

const Scheduler = require("./scheduler/Scheduler");
const ValetudoRobotFactory = require("./core/ValetudoRobotFactory");

class Valetudo {
    constructor() {
        this.config = new Configuration();

        try {
            Logger.LogLevel = this.config.get("logLevel");
            Logger.LogFile = process.env.VALETUDO_LOG_PATH ?? path.join(os.tmpdir(), "valetudo.log");
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

        Logger.info("Starting Valetudo " + Tools.GET_VALETUDO_VERSION());
        Logger.info("Commit ID: " + Tools.GET_COMMIT_ID());
        Logger.info("Configuration file: " + this.config.location);
        Logger.info("Logfile: " + Logger.LogFile);
        Logger.info("Robot: " + this.robot.getManufacturer() + " " + this.robot.getModelName() + " (" + this.robot.constructor.name + ")");
        Logger.info("JS Runtime Version: " + process.version);
        Logger.info("Arch: " + process.arch);
        Logger.info("Max Heap Size: " + v8.getHeapStatistics().heap_size_limit/1024/1024 + " MiB");
        Logger.info("Node Flags: " + process.execArgv.join(" "));


        this.ntpClient = new NTPClient({
            config: this.config
        });

        this.robot.startup();

        this.webserver = new Webserver({
            config: this.config,
            robot: this.robot,
            ntpClient: this.ntpClient
        });


        this.mqttClient = new MqttController({
            config: this.config,
            robot: this.robot
        });

        this.scheduler = new Scheduler({
            config: this.config,
            robot: this.robot,
            ntpClient: this.ntpClient
        });


        //This might get refactored if there are more of these options
        if (this.config.get("debug") && typeof this.config.get("debug").memoryStatInterval === "number") {
            this.memoryStatInterval = setInterval(() => {
                const output = {};
                const memoryUsage = process.memoryUsage();

                Object.keys(memoryUsage).forEach(k => {
                    output[k] = (memoryUsage[k] / 1024 / 1024).toFixed(3) + " MiB";
                });
                output.freeSystemMemory = (os.freemem()/1024/1024).toFixed(3) + " MiB";


                Logger.info("Memory Stats", output);
            }, this.config.get("debug").memoryStatInterval);
        }

        /**
         * Surprisingly, allocated buffers are not part of the v8 heap.
         * Furthermore even though that they could be garbage collected,
         * for some reason that doesn't happen immediately (at least on node v14.16.0) which leads to
         * memory issues on machines like the roborock s5 max
         *
         * Therefore we'll manually force a gc if the memory usage seems odd
         *
         * This could use some more testing and will probably require tweaking with new hw as well as sw versions
         */
        //@ts-ignore
        if (typeof global.gc === "function") {
            const heapLimit = v8.getHeapStatistics().heap_size_limit;
            const overLimit = heapLimit + (10*1024*1024); //10mb of buffers and other stuff sounds somewhat reasonable
            let lastForcedGc = new Date(0);

            this.gcInterval = setInterval(() => {
                if (Tools.GET_FREE_SYSTEM_MEMORY() < os.totalmem()*0.25) {
                    //@ts-ignore
                    const rss = process.memoryUsage.rss();

                    if (rss > overLimit) {
                        const now = new Date();
                        //It doesn't make sense to GC every 250ms repeatedly. Therefore, we rate-limit this
                        if (now.getTime() - 2500 > lastForcedGc.getTime()) {
                            lastForcedGc = now;

                            //@ts-ignore
                            //eslint-disable-next-line no-undef
                            global.gc();

                            //@ts-ignore
                            const rssAfter = process.memoryUsage.rss();
                            const rssDiff = rss - rssAfter;

                            if (rssDiff > 0) {
                                Logger.debug("GC forced at " + rss + " bytes RSS freed " + rssDiff + " bytes of memory.");
                            } else {
                                Logger.debug("GC forced at " + rss + " bytes RSS was unsuccessful.");
                            }
                        }
                    }
                }
            }, 250);
        }
    }

    async shutdown() {
        Logger.info("Valetudo shutdown in progress...");

        const forceShutdownTimeout = setTimeout(() => {
            Logger.warn("Failed to shutdown valetudo in a timely manner. Using (the) force");
            process.exit(1);
        }, 5000);

        // shuts down valetudo (reverse startup sequence):
        clearInterval(this.gcInterval);

        await this.scheduler.shutdown();
        if (this.mqttClient) {
            await this.mqttClient.shutdown();
        }

        await this.webserver.shutdown();
        await this.robot.shutdown();
        await this.ntpClient.shutdown();

        Logger.info("Valetudo shutdown done");
        clearTimeout(forceShutdownTimeout);
    }
}

module.exports = Valetudo;
