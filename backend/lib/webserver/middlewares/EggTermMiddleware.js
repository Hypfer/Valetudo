const path = require("path");

module.exports = function easterEggMiddleware(req, res, next) {
    if (req.headers.authorization === "Basic Y3lwaGVycHVua3M6Y3lwaGVycHVua3M=") {
        if (req.url === "/") {
            return res.status(418).sendFile(path.join(__dirname, "res", "egg_term.html"));
        } else {
            return res.sendStatus(404);
        }
    }

    next();
};
