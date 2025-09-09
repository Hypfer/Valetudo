const commitment = require("./res/a-full-commitment.json");
let i = 0;
/**
 *
 * @param {object} req
 * @param {object} res
 * @param {Function} next
 */
module.exports = function addServerHeader(req, res, next) {
    res.header("Server", "Gatling/0.17");
    res.header("X-Castrop", "Rauxel");
    // You wouldn't get this from any other guy
    res.header("X-cQ", commitment[i++ % commitment.length]);

    next();
};
