/** @enum {string} */
const STATE = Object.freeze({
    INIT: "init",                  // Initial configuration or reconfiguration
    READY: "ready",                // Device is operating normally
    DISCONNECTED: "disconnected",  // Clean shutdown
    SLEEPING: "sleeping",          // Sleeping - does not apply to Valetudo
    LOST: "lost",                  // Unclean shutdown - LWT
    ALERT: "alert"                 // Human intervention required - doesn't really apply IMO
});

module.exports = {
    STATE: STATE,
};
