import {createSocket} from "dgram";
import process from "process";

import MiioSocket from "./lib/miio/MiioSocket";
import Model from "./lib/miio/Model";
import Valetudo from "./lib/Valetudo";

const model = new Model(Valetudo.VACUUM_MODEL_PROVIDER());
const token = Valetudo.NATIVE_TOKEN_PROVIDER();

function createLocalSocket() {
    let socket = createSocket("udp4");
    socket.bind(54321, "127.0.0.1");
    return socket;
}

class FakeRoborock {
    constructor(token) {
        this.localSocket = new MiioSocket({
            socket: createLocalSocket(),
            token: token,
            onMessage: this.onMessage.bind(this),
            name: 'local'
        });
    }
    onMessage(msg) {
        console.log('incoming', msg);
        switch (msg['method']) {
            case "get_status":
                this.localSocket.sendMessage({
                    "id": msg['id'],
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
        }
    }
}

const device = new FakeRoborock(token);

process.on('exit', function() { console.info("exiting..."); });
