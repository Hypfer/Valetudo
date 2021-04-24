const Tools = require("../../Tools");

const version = Tools.GET_VALETUDO_VERSION();
const commitId = Tools.GET_COMMIT_ID();
/**
 * The main purpose of these headers is to make it easier
 * to find internet-facing valetudo instances using shodan.io
 * so that I can be mad about them
 *
 * Don't do that.
 * Use a VPN or at least a reverse-proxy with proper auth.
 *
 * By ignoring this warning, you opt-in to valetudo
 * telemetry data collection via the cloud
 *
 *
 * @param {object} req
 * @param {object} res
 * @param {Function} next
 */
module.exports = function addVersionHeader(req, res, next) {
    res.header("X-Valetudo-Version", version);
    res.header("X-Valetudo-Commit-Id", commitId);
    next();
};
