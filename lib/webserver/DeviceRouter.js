const express = require("express");
const crypto = require("crypto");

const DummyCloud = require("../miio/Dummycloud");
const Logger = require("../Logger");

/**
 * Api routes used by the device
 *
 * @param {import("./WebServer")} webserver
 */
const DeviceRouter = function(webserver) {
    const router = express.Router();
    const vacuum = webserver.vacuum;

    router.put("/api/miio/map_upload_handler", (req, res) => {
        Logger.debug("map_upload_handler", req.query);
        if (!webserver.mapUploadInProgress) {
            webserver.mapUploadInProgress = true;

            var data = [];
            req.on("data", chunk => data.push(chunk));

            req.on("end", () => {
                const uploadedGzippedMapData = Buffer.concat(data);
                vacuum.preprocessMap(uploadedGzippedMapData)
                    .then(data => {
                        const dataToHash = data.length > 48 ? data.slice(20, data.length - 29) : data; //strip index,sequence + digest
                        const hashOfNewMap = crypto.createHash("sha1").update(dataToHash).digest("base64");

                        if (hashOfNewMap !== webserver.map.hash) {
                            const parsedMap = vacuum.parseMap(data);

                            if (parsedMap !== null) {
                                webserver.map.parsedData = parsedMap;
                                webserver.map.hash = hashOfNewMap;

                                webserver.events.emit("valetudo.map");
                            }
                        }
                    })
                    .finally(() => webserver.mapUploadInProgress = false);
                res.sendStatus(200);
            });
        } else {
            //This prevents valetudo from leaking memory
            res.end();
            req.connection.destroy();
        }
    });

    // clang-format off
    /*
    Handle viomi load balancing requests:

    GET /gslb?tver=2&id=277962183&dm=ot.io.mi.com&timestamp=1574455630&sign=nNevMcHtzuB90okJfG9zSyPTw87u8U8HQpVNXqpVt%2Bk%3D HTTP/1.1
    Host:110.43.0.83
    User-Agent:miio-client

    {"info":{"host_list":[{"ip":"120.92.65.244","port":8053},{"ip":"120.92.142.94","port":8053},{"ip":"58.83.177.237","port":8053},{"ip":"58.83.177.239","port":8053},{"ip":"58.83.177.236","port":8053},{"ip":"120.92.65.242","port":8053}],"enable":1},"sign":"NxPNmsa8eh2/Y6OdJKoEaEonR6Lvrw5CkV5+mnpZois=","timestamp":"1574455630"}
    */
    // clang-format on
    router.get("/gslb", (req, res) => {
        const dummycloudIP = webserver.configuration.get("dummycloud").spoofedIP;
        const info = {"host_list": [{"ip": dummycloudIP, "port": DummyCloud.PORT}], "enable": 1};
        const signature = crypto.createHmac("sha256", webserver.cloudKey)
            .update(JSON.stringify(info))
            .digest("base64");
        res.status(200).send(
            {"info": info, "timestamp": req.query["timestamp"], "sign": signature});
    });

    return router;
};

module.exports = DeviceRouter;