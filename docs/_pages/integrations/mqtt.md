---
title: MQTT
category: Integrations
order: 20
---
## MQTT

To make your Robot talking to your MQTT broker (like Home Assistant or Node-RED) configure it via Valetudo webinterface (Settings->MQTT).  
Topic prefix `valetudo` and identifier `robot` can be changed.

### Published topics

#### valetudo/robot/status

Online/offline status.

#### valetudo/robot/state

Current state, battery_level and fan_speed.

#### valetudo/robot/map_data

Map data as deflated JSON (optionally base64 encoded).

### Consumed topics

#### valetudo/robot/command

Possible values: "start", "return_to_base", "stop", "clean_spot", "locate", "pause".

#### valetudo/robot/custom_command

See MqttClient.handleCustomCommand for details.

#### valetudo/robot/set_fan_speed

Possible values: "off", "min", "low", "medium", "high", "max", "turbo".  
Maybe not all values ​​are supported by your vacuum.

### Example commands

Here are some commands you can publish to control the vacuum:

```Shell
mosquitto_pub -h yourserver -t "valetudo/robot/command" -m "locate"
mosquitto_pub -h yourserver -t "valetudo/robot/command" -m "start"
mosquitto_pub -h yourserver -t "valetudo/robot/command" -m "stop"
mosquitto_pub -h yourserver -t "valetudo/robot/command" -m "pause"
mosquitto_pub -h yourserver -t "valetudo/robot/command" -m "locate"
mosquitto_pub -h yourserver -t "valetudo/robot/command" -m "return_to_base"
```
