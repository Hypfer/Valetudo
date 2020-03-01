const fs = require("fs").promises;

class SSHManager {

    async setSSHKeys(keys) {
        await fs.writeFile("/root/.ssh/authorized_keys", keys, {"encoding": "utf-8"});
    }

    async getSSHKeys() {
        return await fs.readFile("/root/.ssh/authorized_keys", {"encoding": "utf-8"});
    }
}

module.exports = SSHManager;
