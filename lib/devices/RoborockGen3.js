const RoborockS5 = require("./RoborockS5");

/*
    This class is a hackish way to support S6/S5 Max without changing much of the code
    The correct way to do this would be a feature component system
 */
class RoborockGen3 extends RoborockS5 {
    constructor(options) {
        super(options);

        //These are always gen3
        this.isGen3 = true;
    }

    parseStatus(res) {
        super.parseStatus(res);
        this.isGen3 = true;
    }

    detectFanSpeeds(msg_ver) {
        super.detectFanSpeeds(3); //lol hack
    }

}

module.exports = RoborockGen3;