const Logger = require("./Logger");
const Tools = require("./utils/Tools");

const Bonjour = require("bonjour-service");
const SSDPServer = require("./utils/SSDPServer");

const NETWORK_STATE_CHECK_INTERVAL = 30 * 1000;

class NetworkAdvertisementManager {
    /**
     * This class handles advertisement via both SSDP (UPnP) and zeroconf/mdns/bonjour
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

        this.config.onUpdate((key) => {
            if (key === "networkAdvertisement") {
                this.restart().catch((err) => {
                    Logger.warn("Error while restarting NetworkAdvertisementManager due to config change", err);
                });
            }
        });

        this.setUp();
    }

    /**
     * @public
     * @return {{port: number, zeroconfHostname: string}}
     */
    getProperties() {
        return {
            port: this.webserverPort,
            zeroconfHostname: Tools.GET_ZEROCONF_HOSTNAME()
        };
    }

    /**
     * @private
     */
    setUp() {
        const networkAdvertisementConfig = this.config.get("networkAdvertisement");

        if (this.config.get("embedded") === true) {
            if (networkAdvertisementConfig.enabled === true) {
                this.setUpSSDP();
                this.setUpBonjour();

                this.ipAddresses = Tools.GET_CURRENT_HOST_IP_ADDRESSES().sort().join();
                this.networkStateCheckTimeout = setTimeout(() => {
                    this.checkNetworkStateAndReschedule();
                }, NETWORK_STATE_CHECK_INTERVAL);
            }
        } else {
            Logger.info("Not starting NetworkAdvertisementManager because we're not in embedded mode");
        }

    }

    /**
     * @private
     */
    setUpSSDP() {
        this.ssdpServer = new SSDPServer({
            port: this.webserverPort
        });

        try {
            this.ssdpServer.start();
        } catch (e) {
            Logger.warn("Error while starting SSDP/UPnP advertisement", e);
        }
    }

    /**
     * @private
     */
    setUpBonjour() {
        this.bonjourServer = new Bonjour.Bonjour(undefined, (err) => {
            Logger.warn("Error while responding to mDNS query:", err);

            this.restart().catch(err => {
                this.shutdown().catch(err => {
                    throw err;
                });
            });
        });

        Logger.info("Valetudo can be reached via: " + Tools.GET_ZEROCONF_HOSTNAME());

        this.publishBonjourService(`Valetudo ${Tools.GET_HUMAN_READABLE_SYSTEM_ID()} Web`, "http");
        this.publishBonjourService(`Valetudo ${Tools.GET_HUMAN_READABLE_SYSTEM_ID()}`, "valetudo");
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
