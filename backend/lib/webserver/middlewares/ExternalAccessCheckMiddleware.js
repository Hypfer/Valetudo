const isInSubnet = require("is-in-subnet");
const Logger = require("../../Logger");

/**
 *
 * @param {object} req
 * @param {object} res
 * @param {Function} next
 */
module.exports = function checkExternalAccess(req, res, next) {
    if (isAllowed(req.ip)) {
        next();
    } else {
        Logger.warn(`Blocked external request to ${req.url} from ${req.ip}`);

        res.status(401).send("External access to Valetudo is blocked.");
    }
};


function isAllowed(ip) {
    let allowed = false;

    try {
        /* See https://github.com/jshttp/on-finished/issues/8 for why req.ip can be undefined
           Quote:
             req.url and such are strings. req.ip is a getter property that calls req.remoteAddress that is a getter
             that does a network socket call, so its value depends on the state of the socket
         */
        allowed = ip !== undefined && (isInSubnet.isPrivate(ip) || isInSubnet.isLocalhost(ip));
    } catch (e) {
        Logger.warn("Error during external access check", e);
    }

    return allowed;
}
