const net = require("net");
const http = require("http");
const Tools = require("../Tools");

//Adapted from https://stackoverflow.com/a/42019773/10951033
class DualUseTCPServer {

    /**
     * @param {*} handler
     */
    constructor(handler) {
        this.server = net.createServer(socket => {
            socket.once('data', buffer => {
                // Pause the socket
                socket.pause();


                //ASCII = HTTP, lol
                if (Tools.IS_ASCII(buffer.toString())) {
                    socket.unshift(buffer);

                    this.httpServer.emit("connection", socket);
                } else if (this.miioServer) {
                    socket.unshift(buffer);

                    this.miioServer.emit("connection", socket);
                }

                // As of NodeJS 10.x the socket must be
                // resumed asynchronously or the socket
                // connection hangs, potentially crashing
                // the process. Prior to NodeJS 10.x
                // the socket may be resumed synchronously.
                process.nextTick(() => socket.resume());
            });
        });

        this.miioServer = undefined;
        this.httpServer = http.createServer(handler);
    }

    getServer() {
        return this.server;
    }

    setMiioServer(miioServer) {
        this.miioServer = miioServer;
    }

}

module.exports = DualUseTCPServer;
