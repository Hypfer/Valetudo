const SimpleToggleCapabilityMqttHandle = require("./SimpleToggleCapabilityMqttHandle");


class ObstacleAvoidanceControlCapabilityMqttHandle extends SimpleToggleCapabilityMqttHandle {}

ObstacleAvoidanceControlCapabilityMqttHandle.OPTIONAL = true;

module.exports = ObstacleAvoidanceControlCapabilityMqttHandle;
