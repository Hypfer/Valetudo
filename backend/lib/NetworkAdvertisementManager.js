const Logger = require("./Logger");
const Tools = require("./Tools");

const Bonjour = require("bonjour-service");
const nodessdp = require("node-ssdp");

class NetworkAdvertisementManager {
    /**
     * This class handles advertisement via both SSDP (UPnP) as well as zeroconf/mdns/bonjour
     *
     * @param {object} options
     * @param {import("./Configuration")} options.config
     * @param {import("./core/ValetudoRobot")} options.robot
     */
    constructor(options) {
        this.config = options.config;
        this.robot = options.robot;

        this.zeroConfHostname = "valetudo_" + Tools.GET_HUMAN_READABLE_SYSTEM_ID().toLowerCase() + ".local";
        this.webserverPort = this.config.get("webserver")?.port ?? 80;

        this.setUp();
    }

    /**
     * @private
     */
    setUp() {
        const networkAdvertisementConfig = this.config.get("networkAdvertisement");

        if (networkAdvertisementConfig.enabled === true && this.config.get("embedded") === true) {
            this.setUpSSDP();
            this.setUpBonjour();
        }
    }

    /**
     * @private
     */
    setUpSSDP() {
        this.ssdpServer = new nodessdp.Server({
            location: {
                port: this.webserverPort,
                path: "/_ssdp/valetudo.xml"
            }
        });

        this.ssdpServer.addUSN("upnp:rootdevice");
        this.ssdpServer.addUSN("uuid:" + Tools.GET_SYSTEM_ID() + "::upnp:rootdevice");

        this.ssdpServer.start(err => {
            if (err) {
                Logger.warn("Error while starting SSDP/UPnP advertisement", err);
            } else {
                Logger.info("SSDP/UPnP advertisement started");
            }
        });
    }

    /**
     * @private
     */
    setUpBonjour() {
        this.bonjourServer = new Bonjour.Bonjour(undefined, (err) => {
            Logger.warn("Error while responding to mDNS query:", err);

            this.restart().then(() => {/*intentional*/}).catch(err => {
                this.shutdown().then(() => {/*intentional*/}).catch(err => {
                    throw err;
                });
            });
        });

        Logger.info("Valetudo can be reached via: " + this.zeroConfHostname);

        this.publishBonjourService("Valetudo " + this.robot.getModelName() + " Web", "http");
        this.publishBonjourService("Valetudo " + this.robot.getModelName(), "valetudo");
    }

    /**
     * @private
     * @param {string} name
     * @param {string} type
     */
    publishBonjourService(name, type) {
        const service = this.bonjourServer.publish({
            name: name,
            type: type,
            host: this.zeroConfHostname,
            port: this.webserverPort,
            probe: false,
            txt: {
                id: Tools.GET_HUMAN_READABLE_SYSTEM_ID(),
                model: this.robot.getModelName(),
                manufacturer: this.robot.getManufacturer(),
                version: Tools.GET_VALETUDO_VERSION()
            }
        });

        service.on("up", () => {
            Logger.info("Bonjour service \"" + name + "\" with type \"" + type + "\" started");
        });

        service.on("error", (err) => {
            Logger.warn("Error while starting Bonjour service \"" + name + "\" with type \"" + type + "\"", err);
        });

        service.start();
    }

    /**
     * Shutdown NetworkAdvertisementManager
     *
     * @public
     * @returns {Promise<void>}
     */
    shutdown() {
        return new Promise((resolve, reject) => {
            Logger.debug("NetworkAdvertisementManager shutdown in progress...");

            if (this.ssdpServer) {
                try {
                    this.ssdpServer.stop();
                } catch (err) {
                    Logger.warn("Error while stopping SSDP Server", err);
                }
            }

            if (this.bonjourServer) {
                this.bonjourServer.unpublishAll(() => {
                    this.bonjourServer.destroy();

                    Logger.debug("NetworkAdvertisementManager shutdown done");
                    resolve();
                });
            } else {
                Logger.debug("NetworkAdvertisementManager shutdown done");

                resolve();
            }
        });
    }

    /**
     * Restart NetworkAdvertisementManager
     *
     * @private
     * @returns {Promise<void>}
     */
    async restart() {
        Logger.info("Restarting NetworkAdvertisementManager");

        try {
            await this.shutdown();
            this.setUp();
        } catch (err) {
            Logger.error("Error while restarting NetworkAdvertisementManager", err);

            throw err;
        }
    }
}

module.exports = NetworkAdvertisementManager;
