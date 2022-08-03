const Logger = require("../../../Logger");


/**
 * @param {object} options
 * @param {import("./SSEHub")} options.hub
 * @param {number} options.keepAliveInterval
 * @param {number} options.maxClients
 *
 *
 * @returns {(function(*, *, *): void)|*}
 */
module.exports = function(options) {
    /**
     * @param {object} req
     * @param {object} res
     * @param {Function} next
     */
    return function SSEMiddleware(req, res, next) {
        if (options.hub.clients.size >= options.maxClients) {
            Logger.debug(`More than ${options.maxClients} SSE clients are connected to the ${options.hub.name} SSE Hub. Terminating the oldest connection.`);

            //Sets are iterated in insertion order. Therefore, to disconnect the oldest connection,
            //we just take the first value
            const clientToTerminate = options.hub.clients.values().next().value;

            clientToTerminate.terminate();
            options.hub.clients.delete(clientToTerminate);
        }

        res.sse = {
            write(data) {
                write(data);
            },
            terminate() {
                res.end();
                res.socket?.destroy();
            }
        };

        options.hub.register(res.sse);

        res.once("close", () => {
            options.hub.unregister(res.sse);
        });

        res.once("finish", () => {
            options.hub.unregister(res.sse);
        });


        res.set({
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no"
        });

        res.flushHeaders();

        startKeepAlives(options.keepAliveInterval);


        next();

        function write(chunk) {
            /*
              Quoting https://nodejs.org/api/net.html#net_socket_buffersize
                net.Socket has the property that socket.write() always works. This is to help users get up and running quickly.
                The computer cannot always keep up with the amount of data that is written to a socket.
                The network connection simply might be too slow. Node.js will internally queue up the data written to a socket
                and send it out over the wire when it is possible.



                Since we're operating on a tight ram budget, we cannot do that. Therefore, this checks if there is anything
                cached and if yes we terminate the connection as it has been stale for too long already.

                It does take quite a while until this value increases above 0 for some reason. Likely due to other buffers elsewhere

             */
            if (res.socket?.writableLength > 0) {
                Logger.debug(`Stale SSE connection to the ${options.hub.name} SSE Hub detected. Terminating.`);

                res.socket?.destroy();

                return false;
            } else {
                res.write(chunk);

                //required for compression
                res.flush();
            }
        }

        /**
         * Writes heartbeats at a regular rate on the socket.
         *
         * @param {number} interval
         */
        function startKeepAlives(interval) {
            //=> Regularly send keep-alive SSE comments, clear interval on socket close
            const keepAliveTimer = setInterval(() => {
                return write(": sse-keep-alive\n");
            }, interval);
            //=> When the connection gets closed (close=client, finish=server), stop the keep-alive timer
            res.once("close", () => {
                return clearInterval(keepAliveTimer);
            });
            res.once("finish", () => {
                return clearInterval(keepAliveTimer);
            });
        }
    };
};
