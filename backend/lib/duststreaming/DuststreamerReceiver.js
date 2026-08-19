const dgram = require("dgram");

const Logger = require("../Logger");


class DuststreamerReceiver {
    /**
     * @param {object} options
     * @param {string} options.host
     * @param {number} options.port
     * @param {(buf: Buffer) => void} options.onDatagram
     * @param {(err: Error) => void} options.onSocketError
     */
    constructor(options) {
        this.onDatagram = options.onDatagram;
        this.onSocketError = options.onSocketError;

        this.socketErrorReported = false;

        Logger.debug("Binding duststreamer UDP receiver socket to", options.host + ":" + options.port);

        this.socket = dgram.createSocket({ type: "udp4", reuseAddr: true });

        this.socket.on("message", (buf) => {
            this.onDatagram(buf);
        });

        this.socket.on("error", (err) => {
            Logger.warn("Error on duststreamer UDP receiver socket", err);

            if (!this.socketErrorReported) {
                this.socketErrorReported = true;

                this.onSocketError(err);
            }
        });

        this.socket.bind(options.port, options.host, () => {
            Logger.debug("Duststreamer UDP receiver bound on", options.host + ":" + options.port);
        });
    }

    /**
     * @public
     */
    close() {
        Logger.debug("Closing duststreamer UDP receiver socket");

        try {
            this.socket.close();
        } catch (e) {
            // Intentional
        }
    }
}

module.exports = DuststreamerReceiver;
