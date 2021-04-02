const cecotec = require("./cecotec");
const dreame = require("./dreame");
const mock = require("./mock");
const roborock = require("./roborock");
const viomi = require("./viomi");

module.exports = Object.assign({},
    cecotec,
    roborock,
    viomi,
    dreame,
    mock
);
