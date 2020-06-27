const fs = require("fs");
const Logger = require("../Logger");

class Model {
    /**
     * @param {object} options
     * @param {string} options.identifier
     * @param {boolean} options.embedded
     * @param {object} [options.config]
     * @param {string} [options.config.ip]
     * @param {string} [options.config.deviceId]
     * @param {string} [options.config.cloudSecret]
     * @param {string} [options.config.localSecret]
     */
    constructor(options) {
        this.identifier = options.identifier;

        if (this.identifier === "auto") {
            // noinspection JSPotentiallyInvalidConstructorUsage
            this.identifier = VACUUM_MODEL_PROVIDER();
        }

        this.embedded = !!options.embedded;

        options.config = options.config || {};
        this.config = {
            ip: options.config.ip ? options.config.ip : "127.0.0.1",
            deviceId: options.config.deviceId ? parseInt(options.config.deviceId, 10) : DEVICE_ID_PROVIDER(),
        };

        if (options.config.cloudSecret) {
            switch (options.config.cloudSecret.length) {
                case 32:
                    this.config.cloudSecret = Buffer.from(options.config.cloudSecret, "hex");
                    break;
                case 16:
                    this.config.cloudSecret = Buffer.from(options.config.cloudSecret, "utf-8");
                    break;
                default:
                    Logger.error("Invalid CloudSecret with length" + options.config.cloudSecret.length);
                    this.config.cloudSecret = Buffer.alloc(16);
            }
        } else if (this.embedded === true) {
            this.config.cloudSecret = CLOUD_SECRET_PROVIDER();
        } else {
            Logger.error("Missing CloudSecret and not running on a real vacuum");
            this.config.cloudSecret = Buffer.alloc(16);
        }

        if (options.config.localSecret) {
            switch (options.config.localSecret.length) {
                case 32:
                    this.config.localSecret = Buffer.from(options.config.localSecret, "hex");
                    break;
                case 16:
                    this.config.localSecret = Buffer.from(options.config.localSecret, "utf-8");
                    break;
                default:
                    Logger.error("Invalid LocalSecret with length" + options.config.localSecret.length);
                    this.config.localSecret = Buffer.alloc(16);
            }

            this.config.localSecretProvider = () => {
                return this.config.localSecret;
            };
        } else if (this.embedded === true) {
            this.config.localSecretProvider = NATIVE_TOKEN_PROVIDER;
        } else {
            Logger.error("Missing LocalSecret and not running on a real vacuum.");
            this.config.localSecret = Buffer.alloc(16);

            this.config.localSecretProvider = () => {
                return this.config.localSecret;
            };
        }

        let parsedName = this.identifier.match(DEVICE_REGEX);
        if (parsedName && parsedName.groups) {
            this.manufacturer = parsedName.groups.manufacturer;
            this.modelIdentifier = parsedName.groups.modelIdentifier;
        }
    }

    /**
     * Returns capabilities that differ by model.
     * @public
     */
    getCapabilities() {
        return {
            "persistent_data": this.identifier !== "rockrobo.vacuum.v1" &&
                                   !this.identifier.startsWith("viomi.vacuum")
        };
    }

    /**
     * Returns the manufacturer of the robot
     * @public
     * @returns {string}
     */
    getManufacturerName() {
        return VACUUM_MANUFACTURERS[this.manufacturer] || UNKNOWN;
    }

    /**
     * @public
     * @returns {string}
     */
    getModelName() {
        if (this.manufacturer && MODELS[this.manufacturer]) {
            return MODELS[this.manufacturer][this.modelIdentifier] || UNKNOWN;
        } else {
            return UNKNOWN;
        }
    }

    /**
     * @public
     * @returns {string}
     */
    getModelIdentifier() {
        return this.identifier;
    }

    /**
     * This determines whether or not we're installed directly on the vacuum robot itself
     *
     * @public
     * @returns {boolean}
     */
    isEmbedded() {
        return this.embedded;
    }

    /**
     * @public
     * @returns {number}
     */
    getDeviceId() {
        return this.config.deviceId;
    }

    /**
     *
     * @returns {Buffer}
     */
    getCloudSecret() {
        return this.config.cloudSecret;
    }

    /**
     * @public
     * @returns {(function(): Buffer)}
     */
    getLocalSecretProvider() {
        return this.config.localSecretProvider;
    }

    /**
     * @public
     * @returns {string}
     */
    getIP() {
        return this.config.ip;
    }
}


const DEVICE_REGEX = /^(?<manufacturer>[a-z]*)\.(?:[a-z]*)\.(?<modelIdentifier>[a-z0-9]*)$/;
const VACUUM_MANUFACTURERS = {
    "viomi": "Viomi Technology Co., Ltd",
    "roborock": "Beijing Roborock Technology Co., Ltd.",
    "rockrobo": "Beijing Roborock Technology Co., Ltd." //🙄
};
const MODELS = {
    "viomi": {
        "v7": "Xiaomi Mijia STYJ02YM"
    },
    "roborock": {
        "s5": "S5",
        "s5e": "S5 Max",
        "s6": "S6",
        "t6": "T6",
        "s4": "S4",
        "t4": "T4",
        "1s": "1S"
    },
    "rockrobo": {
        "v1": "Xiaomi Mi SDJQR02RR"
    }
};
const UNKNOWN = "Unknown";



/**
 * Returns a {did: …, key:…, vendor: …, mac: …, model: …} object.
 */
function readDeviceConf() {
    let deviceConf;
    const deviceConfFiles =
        ["/mnt/default/device.conf", "/etc/miio/device.conf"];
    const filename = deviceConfFiles.filter(fs.existsSync)[0];
    if (!filename) {
        Logger.error("Could not find a device.conf file in ", deviceConfFiles);
    } else {
        try {
            deviceConf = fs.readFileSync(filename);
        } catch (e) {
            Logger.warn("cannot read", filename, e);
        }
    }

    let result = {};
    if (deviceConf) {
        deviceConf.toString().split(/\n/).map(line => line.split(/=/, 2)).map(([k, v]) => result[k] = v);
    }
    if (!result["did"] || !result["key"] || !result["model"]) {
        Logger.error("Failed to read device.conf");
    }
    return result;
}

function NATIVE_TOKEN_PROVIDER() {
    const tokenFiles =
        ["/mnt/data/miio/device.token", "/etc/miio/device.token"];
    const filename = tokenFiles.filter(fs.existsSync)[0];
    if (!filename) {
        Logger.error("Could not find a device.token file in ", tokenFiles);
    } else {
        let line;
        try {
            line = fs.readFileSync(filename);
        } catch (e) {
            Logger.debug("cannot read", filename, e);
        }
        if (line && line.length >= 32) {
            // For local development, people might put in the hex representation of the token.
            // Make this work too.
            return Buffer.from(line.toString().slice(0, 32), "hex");
        }
        if (line && line.length >= 16) {
            return line.slice(0, 16);
        }
    }
    Logger.error("Unable to fetch token");
    return Buffer.alloc(16);
}

function CLOUD_SECRET_PROVIDER() {
    const cloudSecret = readDeviceConf()["key"];
    return Buffer.from(
        cloudSecret ? cloudSecret : "0000000000000000" // This doesnt work but it wont crash the system
    );
}

/** @returns {number} */
function DEVICE_ID_PROVIDER() { //TODO: merge with CLOUD_SECRET_PROVIDER
    const did = readDeviceConf()["did"];
    return did ? parseInt(did, 10) : 0;
}

function VACUUM_MODEL_PROVIDER() {
    const model = readDeviceConf()["model"];
    return model ? model : "rockrobo.vacuum.v1";
}

module.exports = Model;
