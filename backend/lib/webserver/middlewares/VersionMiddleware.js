const Tools = require("../../utils/Tools");

const version = Tools.GET_VALETUDO_VERSION();
const commitId = Tools.GET_COMMIT_ID();
/**
 * These headers are used by the frontend to determine if the backend was updated
 * so that it can force a refresh.
 * Using headers for that prevents us from periodically polling the backend for its version.
 *
 * It also makes it much easier to find publicly accessible Valetudo instances on shodan.io
 * Don't do that.
 * Use a VPN or at least a reverse-proxy with proper auth.
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
