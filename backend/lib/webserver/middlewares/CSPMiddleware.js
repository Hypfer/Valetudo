/**
 *
 * @param {object} req
 * @param {object} res
 * @param {Function} next
 */
module.exports = function addCSPHeader(req, res, next) {
    res.header("Content-Security-Policy", "worker-src 'self';");
    next();
};
