const roborock = require("./roborock");
const viomi = require("./viomi");
const dreame = require("./dreame");
const mock = require("./mock");

module.exports = Object.assign({},
    roborock,
    viomi,
    dreame,
    mock
);
