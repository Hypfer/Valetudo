const SerializableEntity = require("../SerializableEntity");

class ValetudoRobotError extends SerializableEntity {
    /**
     * @param {object} options
     * @param {object} [options.metaData]
     * 
     * @param {object} options.severity
     * @param {ValetudoRobotErrorSeverityKind} options.severity.kind
     * @param {ValetudoRobotErrorSeverityLevel} options.severity.level
     * @param {ValetudoRobotErrorSubsystem} options.subsystem
     * 
     * @param {string} options.message
     * @param {string} options.vendorErrorCode
     */
    constructor(options) {
        super(options);

        this.severity = options.severity;
        this.subsystem = options.subsystem;

        this.message = options.message;
        this.vendorErrorCode = options.vendorErrorCode;
    }
}

/**
 *  @typedef {string} ValetudoRobotErrorSeverityKind
 *  @enum {string}
 *
 */
ValetudoRobotError.SEVERITY_KIND = Object.freeze({
    TRANSIENT: "transient",
    PERMANENT: "permanent",

    UNKNOWN: "unknown"
});

/**
 *  @typedef {string} ValetudoRobotErrorSeverityLevel
 *  @enum {string}
 *
 */
ValetudoRobotError.SEVERITY_LEVEL = Object.freeze({
    INFO: "info",
    WARNING: "warning",
    ERROR: "error",
    CATASTROPHIC: "catastrophic",

    UNKNOWN: "unknown"
});

/**
 *  @typedef {string} ValetudoRobotErrorSubsystem
 *  @enum {string}
 *
 */
ValetudoRobotError.SUBSYSTEM = Object.freeze({
    CORE: "core",
    POWER: "power",
    SENSORS: "sensors",
    MOTORS: "motors",
    NAVIGATION: "navigation",
    ATTACHMENTS: "attachments",
    DOCK: "dock",

    UNKNOWN: "unknown"
});



module.exports = ValetudoRobotError;
