const dgram = require("dgram");
const Logger = require("../Logger");
const Tools = require("./Tools");

/*
    This class is inspired by these projects:

    https://github.com/diversario/node-ssdp
    https://github.com/jlgallego99/simple-ssdp
 */

class SSDPServer {
    /**
     *
     * This is a very basic SSDP/UPNP server implementation, which works well enough
     * to make valetudo show up in the network tab of the Windows explorer
     *
     * For now, it only supports IPv4
     *
     *
     * @param {object} options
     * @param {number} options.port
     */
    constructor(options) {
        this.webserverPort = options.port;

        this.interfaces = Tools.GET_NETWORK_INTERFACES().filter(i => {
            return i.family === "IPv4";
        });
        this.ip = this.interfaces[0]?.address ?? "127.0.0.1";

        this.addMembershipTimeout = undefined;
    }

    start() {
        this.socket = dgram.createSocket({type: "udp4", reuseAddr: true});

        this.socket.on("listening", () => {
            Logger.debug(`SSDP: Socket bound to port ${MULTICAST_SSDP_PORT}`);

            /*
                For some reason that is beyond me, we need to wait before we add the multicast membership,
                as otherwise Valetudo simply won't receive the UDP packages
             */
            this.addMembershipTimeout = setTimeout(() => {
                for (let iface of this.interfaces) {
                    Logger.debug(`SSDP: Adding Multicast membership to ${MULTICAST_SSDP_ADDRESS_v4} for ${iface.address}`);

                    try {
                        this.socket.addMembership(MULTICAST_SSDP_ADDRESS_v4, iface.address);
                    } catch (e) {
                        Logger.warn(`SSDP: Error while adding Multicast membership to ${MULTICAST_SSDP_ADDRESS_v4} for ${iface.address}`, e);
                    }
                }

                this.socket.setMulticastTTL(4);
            }, 2500);
        });

        this.socket.on("message", (msg, rinfo) => {
            if (msg.includes("M-SEARCH") && msg.includes("ST: upnp:rootdevice")) {
                Logger.debug(`SSDP: Received M-SEARCH request for upnp:rootdevice from ${rinfo.address}:${rinfo.port}`);

                const response = [
                    "HTTP/1.1 200 OK",
                    "ST: upnp:rootdevice",
                    `USN: uuid:${Tools.GET_SYSTEM_ID()}::upnp:rootdevice`,
                    "CACHE-CONTROL: max-age=1800",
                    `SERVER: Valetudo/${Tools.GET_VALETUDO_VERSION()} UPnP/1.1`,
                    `LOCATION: http://${this.ip}:${this.webserverPort}/_ssdp/valetudo.xml`,

                    "",
                    "" //Empty line at the end. Without this it won't work!!
                ].join("\r\n");

                this.socket.send(response, 0, response.length, rinfo.port, rinfo.address);
            }
        });

        this.socket.on("error", (err) => {
            Logger.warn("SSDP: Socket error", err);
        });

        this.socket.bind(MULTICAST_SSDP_PORT);
    }

    stop() {
        clearTimeout(this.addMembershipTimeout);

        if (this.socket) {
            this.socket.close();

            this.socket = undefined;
        }
    }
}

const MULTICAST_SSDP_ADDRESS_v4 = "239.255.255.250";
const MULTICAST_SSDP_PORT = 1900;


module.exports = SSDPServer;
