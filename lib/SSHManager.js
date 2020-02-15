const fs = require("fs");

class SSHManager {

    setSSHKeys(keys, callback) {
        fs.writeFile("/root/.ssh/authorized_keys", keys, {}, function (err) {
            if (err) {
                callback(err);
            } else {
                callback(null, keys);
            }
        });
    }

    getSSHKeys (callback) {
        fs.readFile("/root/.ssh/authorized_keys", function (err, data) {
            if (err) {
                callback(null, "");
            } else {
                callback(null, String(data));
            }
        });
    }
}

module.exports = SSHManager;
