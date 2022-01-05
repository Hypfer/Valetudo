const Logger = require("./Logger");
const Tools = require("./Tools");

const Bonjour = require("bonjour-service");
const nodessdp = require("node-ssdp");

const NETWORK_STATE_CHECK_INTERVAL = 30 * 1000;

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

        this.webserverPort = this.config.get("webserver")?.port ?? 80;

        this.networkStateCheckTimeout = undefined;
        this.ipAddresses = "";

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

            this.ipAddresses = Tools.GET_CURRENT_HOST_IP_ADDRESSES().sort().join();
            this.networkStateCheckTimeout = setTimeout(() => {
                this.checkNetworkStateAndReschedule();
            }, NETWORK_STATE_CHECK_INTERVAL);
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

        try {
            this.ssdpServer.start(err => {
                if (err) {
                    Logger.warn("Error while starting SSDP/UPnP advertisement", err);
                } else {
                    Logger.info("SSDP/UPnP advertisement started");
                }
            });
        } catch (e) {
            Logger.warn("Exception while starting SSDP/UPnP advertisement", e);
        }
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

        Logger.info("Valetudo can be reached via: " + Tools.GET_ZEROCONF_HOSTNAME());

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
            host: Tools.GET_ZEROCONF_HOSTNAME(),
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
            clearTimeout(this.networkStateCheckTimeout);

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

    /**
     * @private
     */
    checkNetworkStateAndReschedule() {
        const ipAddresses = Tools.GET_CURRENT_HOST_IP_ADDRESSES().sort().join();

        if (this.ipAddresses !== ipAddresses) {
            Logger.info("Network state changed");

            this.restart().catch((err) => {
                Logger.warn("Error while restarting NetworkAdvertisementManager due to network state change", err);
            });
        } else {
            this.networkStateCheckTimeout = setTimeout(() => {
                this.checkNetworkStateAndReschedule();
            }, NETWORK_STATE_CHECK_INTERVAL);
        }
    }
}

module.exports = NetworkAdvertisementManager;
