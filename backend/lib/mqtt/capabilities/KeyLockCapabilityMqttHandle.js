const SimpleToggleCapabilityMqttHandle = require("./SimpleToggleCapabilityMqttHandle");


class KeyLockCapabilityMqttHandle extends SimpleToggleCapabilityMqttHandle {}

KeyLockCapabilityMqttHandle.OPTIONAL = true;

module.exports = KeyLockCapabilityMqttHandle;
