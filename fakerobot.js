import {createSocket} from "dgram";
import process from "process";

import DummyCloud from "./lib/miio/Dummycloud";
import MiioSocket from "./lib/miio/MiioSocket";
import Model from "./lib/miio/Model";
import RetryWrapper from "./lib/miio/RetryWrapper";
import Valetudo from "./lib/Valetudo";

const model = new Model(Valetudo.VACUUM_MODEL_PROVIDER());

function createLocalSocket() {
    let socket = createSocket("udp4");
    socket.bind(54321, "127.0.0.1");
    return socket;
}

class FakeRoborock {
    constructor() {
        this.localSocket = new MiioSocket({
            socket: createLocalSocket(),
            token: Valetudo.NATIVE_TOKEN_PROVIDER(),
            onMessage: (msg) => this.onMessage(this.localSocket, msg),
            onConnected: () => this.connectCloud(),
            name: "local"
        });
    }
    /** Connect to the valetudo dummycloud interface. */
    connectCloud() {
        console.log("rinfo", this.localSocket.rinfo);
        this.cloudSocket = new MiioSocket({
            socket: createSocket("udp4"),
            rinfo: {address: this.localSocket.rinfo.address, port: DummyCloud.PORT},
            name: "cloud",
            token: Valetudo.CLOUD_KEY_PROVIDER(),
            onMessage: (msg) => this.onMessage(this.cloudSocket, msg),
        });
        // send a message that dummycloud will ignore to force the handshake
        new RetryWrapper(this.cloudSocket, Valetudo.CLOUD_KEY_PROVIDER).sendMessage("_otc.info");
    }
    onMessage(socket, msg) {
        console.log("incoming", msg);
        switch (msg["method"]) {
            case "get_status":
                socket.sendMessage({
                    "id": msg["id"],
                    "result": [{
                        "msg_ver": 2,
                        "msg_seq": 2486,
                        "state": 2,
                        "battery": 81,
                        "clean_time": 672,
                        "clean_area": 10672500,
                        "error_code": 0,
                        "map_present": 1,
                        "in_cleaning": 1,
                        "in_returning": 0,
                        "in_fresh_state": 0,
                        "lab_status": 1,
                        "fan_power": 1,
                        "dnd_enabled": 0
                    }]
                });
                break;
            case "get_map_v1":
                socket.sendMessage({"id": msg["id"], "result": ["ok"]});
                return;
        }
    }
}

console.log("ignoring model", model, "currently only supports roborock.vacuum");
new FakeRoborock();

process.on("exit", function() {
    console.info("exiting...");
});
