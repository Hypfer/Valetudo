const fs = require("fs");
const { exec } = require("child_process");

/***
 * stores current map to a backup folder
 * @param name
 */
function storeMap(name, cb) {
    if (!fs.existsSync("/mnt/data/valetudo/maps")) {
        fs.mkdirSync("/mnt/data/valetudo/maps");
    }

    if (!fs.existsSync("/mnt/data/valetudo/maps/" + name)) {
        fs.mkdirSync("/mnt/data/valetudo/maps/" + name);
    }
    fs.copyFileSync("/mnt/data/rockrobo/last_map", "/mnt/data/valetudo/maps/" + name + "/last_map");
    if (fs.existsSync("/mnt/data/rockrobo/ChargerPos.data")) fs.copyFileSync("/mnt/data/rockrobo/ChargerPos.data", "/mnt/data/valetudo/maps/" + name + "/ChargerPos.data");
    else {
        // we don't have charger info
    }
    fs.copyFileSync("/mnt/data/rockrobo/PersistData_1.data", "/mnt/data/valetudo/maps/" + name + "/PersistData_1.data");
    cb(null);
}

/***
 * restores backed up map
 * @param name
 */
function loadMap(name, cb) {
    if (fs.existsSync("/mnt/data/rockrobo/PersistData_2.data")) fs.unlinkSync("/mnt/data/rockrobo/PersistData_2.data");
    if (fs.existsSync("/mnt/data/rockrobo/StartPos.data")) fs.unlinkSync("/mnt/data/rockrobo/StartPos.data");
    if (fs.existsSync("/mnt/data/rockrobo/user_map0")) fs.unlinkSync("/mnt/data/rockrobo/user_map0");
    fs.copyFileSync("/mnt/data/valetudo/maps/" + name + "/last_map", "/mnt/data/rockrobo/last_map");
    if (fs.existsSync("/mnt/data/valetudo/maps/" + name + "/ChargerPos.data")) fs.copyFileSync("/mnt/data/valetudo/maps/" + name + "/ChargerPos.data", "/mnt/data/rockrobo/ChargerPos.data");
    fs.copyFileSync("/mnt/data/valetudo/maps/" + name + "/PersistData_1.data", "/mnt/data/rockrobo/PersistData_1.data");
    fs.readFile("/mnt/data/rockrobo/RoboController.cfg", "utf8", function (err, data) {
        if (err) {
            console.log(err);
            return cb(err);
        }
        var result = data.replace(/need_recover_map = 1/g, "need_recover_map = 0");

        fs.writeFile("/mnt/data/rockrobo/RoboController.cfg", result, "utf8", function (err) {
            if (err) {
                return cb(err);
            }
            exec("reboot");
            cb(null, "ok");
        });
    });
}

function listStoredMaps(cb) {
    return fs.readdir("/mnt/data/valetudo/maps", function (err, files) {
        //handling error
        if (err) {
            console.log("Unable to scan directory: " + err);
            return cb(err);
        }
        //listing all files using forEach
        cb(null, files);
    });
}

module.exports = { storeMap, loadMap, listStoredMaps };