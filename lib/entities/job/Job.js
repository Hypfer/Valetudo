const ContainerEntity = require("../ContainerEntity");

/**
 * This represents some kind of job which may have happend in the past, is currently happening or is scheduled to happen
 * e.g. action vacuum, type pending and a cron attribute
 */
class Job extends ContainerEntity {
    /**
     *
     * @param {object} options
     * @param {JobType} options.type
     * @param {JobState} options.state
     * @param {JobAction} options.action
     * 
     * @param {number} [options.count]
     *
     * @param {number} [options.id]
     *
     * //TODO: Maybe options for a scheduled cleanup? JobOptions > VacuumJobOptions.
     * //TODO Generic representation of cleaning parameters? => Also needed for section-specific configurations
     * intensity / fanspeed
     * completed actions - spot or dock
     * 
     * @param {Array<import("./attributes/JobAttribute")>} options.attributes
     *
     * @param {object} [options.metaData]
     */
    constructor(options) {
        super(options);

        this.type = options.type;
        this.state = options.state;
        this.action = options.action;

        this.count = options.count;

        this.id = options.id;

        this.attributes = options.attributes;

        this.metaData.version = 1;
    }
}

/**
 *  @typedef {string} JobType
 *  @enum {string}
 *
 */
Job.TYPE = Object.freeze({
    PENDING: "pending",
    ACTIVE: "active",
    COMPLETED: "completed",
    SUMMARY: "summary"
});

/**
 *  @typedef {string} JobState
 *  @enum {string}
 *
 */
Job.STATE = Object.freeze({
    SCHEDULED: "scheduled",
    CANCELLED: "cancelled",
    IN_PROGESS: "in_progress",
    SUCCESSFUL: "successful",
    FAILED: "failed"
});

/**
 *  @typedef {string} JobAction
 *  @enum {string}
 *
 */
Job.ACTION = Object.freeze({
    VACUUM: "vacuum",
    MOP: "mop",
    MOW: "mow"
});

module.exports = Job;