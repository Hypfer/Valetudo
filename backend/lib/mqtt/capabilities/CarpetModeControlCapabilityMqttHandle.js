const SimpleToggleCapabilityMqttHandle = require("./SimpleToggleCapabilityMqttHandle");


class CarpetModeControlCapabilityMqttHandle extends SimpleToggleCapabilityMqttHandle {}

CarpetModeControlCapabilityMqttHandle.OPTIONAL = true;

module.exports = CarpetModeControlCapabilityMqttHandle;
