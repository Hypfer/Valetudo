/**
 *
 * @param {object} req
 * @param {object} res
 * @param {Function} next
 */
module.exports = function addServerHeader(req, res, next) {
    res.header("Server", "Gatling/0.17");
    res.header("X-Castrop", "Rauxel");
    next();
};
