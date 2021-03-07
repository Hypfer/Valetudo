const fs = require("fs");
const path = require("path");

class Tools {
    static MK_DIR_PATH(filepath) {
        var dirname = path.dirname(filepath);
        if (!fs.existsSync(dirname)) {
            Tools.MK_DIR_PATH(dirname);
        }
        if (!fs.existsSync(filepath)) {
            fs.mkdirSync(filepath);
        }
    }

    static ARE_SAME_FILES(filepath1, filepath2) {
        if (filepath1 === filepath2) {
            return true;
        }

        try {
            const stat1 = fs.statSync(filepath1, {bigint: true});
            const stat2 = fs.statSync(filepath2, {bigint: true});
            return (stat1.dev === stat2.dev && stat1.ino === stat2.ino);
        } catch (e) {
            return false;
        }
    }

    static BUFFER_IS_GZIP(buf) {
        return Buffer.isBuffer(buf) && buf[0] === 0x1f && buf[1] === 0x8b;
    }

    static GET_VALETUDO_VERSION() {
        let valetudoVersion = "unknown";

        try {
            const rootDirectory = path.resolve(__dirname, "..");
            const packageContent = fs.readFileSync(rootDirectory + "/package.json", {"encoding": "utf-8"});

            if (packageContent) {
                valetudoVersion = JSON.parse(packageContent.toString()).version;
            }
        } catch (e) {
            //intentional
        }

        return valetudoVersion;
    }

    static GET_COMMIT_ID() {
        let commitId = "unknown";

        try {
            const rootDirectory = path.resolve(__dirname, "..");
            commitId = fs.readFileSync(rootDirectory + "/.git/HEAD", {"encoding": "utf-8"}).trim();

            if(commitId.match(/^ref: refs\/heads\/master$/) !== null) {
                commitId = fs.readFileSync(rootDirectory + "/.git/refs/heads/master", {"encoding": "utf-8"}).trim();
            }
        } catch (e) {
            //intentional
        }

        return commitId;
    }
}

module.exports = Tools;
