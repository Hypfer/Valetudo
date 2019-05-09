const fs = require("fs");

const SSHManager = function () {};

SSHManager.prototype.setSSHKeys = function (keys, callback) {
    fs.writeFile("/root/.ssh/authorized_keys", keys, {}, function (err) {
        if (err) {
            callback(err);
        } else {
            callback(null, keys);
        }
    });
};

SSHManager.prototype.getSSHKeys = function (callback) {
    fs.readFile("/root/.ssh/authorized_keys", function (err, data) {
        if (err) {
            callback(null, "");
        } else {
            callback(null, String(data));
        }
    });
};

module.exports = SSHManager;
