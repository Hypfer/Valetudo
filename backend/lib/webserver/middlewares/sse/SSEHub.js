class SSEHub {
    /**
     *
     * @param {object} options
     * @param {string} options.name
     */
    constructor(options) {
        this.clients = new Set();
        this.name = options.name;
    }


    /**
     * @public
     * @param {*} client
     */
    register(client) {
        this.clients.add(client);
    }

    /**
     * @public
     * @param {*} client
     */
    unregister(client) {
        this.clients.delete(client);
    }

    /**
     *
     * Multi-line strings shall be split and fed into this method line-by-line to be parsable by the frontend
     *
     * @param {string} event
     * @param {string} data
     */
    event(event, data) {
        const payload = `event: ${event}\ndata: ${data}\n\n`;

        this.clients.forEach(client => {
            client.write(payload);
        });
    }

    shutdown() {
        this.clients.forEach(client => {
            client.terminate();
            this.unregister(client);
        });
    }
}

module.exports = SSEHub;
