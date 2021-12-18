const isInSubnet = require("is-in-subnet");
const Logger = require("../../Logger");

/**
 *
 * @param {object} req
 * @param {object} res
 * @param {Function} next
 */
module.exports = function checkExternalAccess(req, res, next) {
    if (!isInSubnet.isPrivate(req.ip) && !isInSubnet.isLocalhost(req.ip)) {
        Logger.warn(`Blocked external request to ${req.url} from ${req.ip}`);

        res.status(401).send("External access to Valetudo is blocked.");
    } else {
        next();
    }
};
