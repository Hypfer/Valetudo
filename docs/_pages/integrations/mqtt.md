---
title: MQTT
category: Integrations
order: 20
---
## MQTT

To make your Robot talking to your MQTT broker (like Home Assistant or Node-RED) configure it via Valetudo webinterface (Settings->MQTT).

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
