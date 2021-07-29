const Logger = require("./Logger");
const Tools = require("./Tools");

const Bonjour = require("bonjour-service");
const nodessdp = require("node-ssdp");
const {generateId} = require("zoo-ids");



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
        const webserverPort = this.config.get("webserver")?.port ?? 80;

        this.ssdpServer = new nodessdp.Server({
            location: {
                port: webserverPort,
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
        const humanReadableId = generateId(
            Tools.GET_SYSTEM_ID(),
            {
                caseStyle: "lowercase",
                delimiter: ""
            }
        )
        const webserverPort = this.config.get("webserver")?.port ?? 80;
        const zeroConfHostname = "valetudo_" + humanReadableId + ".local";

        this.bonjourServer = new Bonjour.Bonjour();

        this.bonjourService = this.bonjourServer.publish({
            name: "Valetudo " + this.robot.getModelName(),
            type: "http",
            host: zeroConfHostname,
            port: webserverPort,
            probe: false
        });
        this.bonjourService.start();

        this.bonjourService.on("up", () => {
            Logger.info("Bonjour advertisement started");
            Logger.info("Valetudo can be reached via: " + zeroConfHostname);
        });

        this.bonjourService.on("error", err => {
            Logger.warn("Error while starting bonjour advertisement", err);
        });
    }

    /**
     * Shutdown SSDPServer
     *
     * @public
     * @returns {Promise<void>}
     */
    shutdown() {
        return new Promise((resolve, reject) => {
            Logger.debug("NetworkAdvertisementManager shutdown in progress...");

            if (this.ssdpServer) {
                this.ssdpServer.stop();
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
}

module.exports = NetworkAdvertisementManager;
