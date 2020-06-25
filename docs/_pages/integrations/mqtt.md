---
title: MQTT
category: Integrations
order: 20
---
## MQTT

To make your Robot talking to your MQTT broker (like Home Assistant or Node-RED) configure it via Valetudo webinterface (Settings->MQTT)
or adapt the config.json file on the robot to your needs (MQTT broker address, username and password of the broker).

```Shell
nano /mnt/data/valetudo/config.json
```

### Example config.json file

```json
{
  "spots": [],
  "areas": [],
  "mqtt": {
    "enabled": true,
    "server": "192.168.1.22",
    "port": 1883,
    "clientId": "",
    "username": "username",
    "password": "password",
    "usetls": false,
    "caPath": "",
    "clientCertPath": "",
    "clientKeyPath": "",
    "qos": 0,
    "identifier": "rockrobo",
    "topicPrefix": "valetudo",
    "autoconfPrefix": "homeassistant",
    "provideMapData": true
  },
  "dummycloud": {
    "spoofedIP": "203.0.113.1",
    "bindIP": "127.0.0.1"
  },
  "map_upload_host": "http://127.0.0.1"
}
```

Make sure `enabled` is set to `true` and the broker_url points to [the broker configured in Home Assistant](https://www.home-assistant.io/docs/mqtt/broker).

After editing the config file, make sure to restart Valetudo for the changes to take effect: `service valetudo restart`

Please note that this command is only available in older ubuntu-based firmwares. If you're running a newer firmware, simply reboot the whole robot.

### Example commands

Here are some commands you can publish to control the vacuum:

```Shell
mosquitto_pub -h yourserver -t "valetudo/rockrobo/command" -m "locate"
mosquitto_pub -h yourserver -t "valetudo/rockrobo/command" -m "start"
mosquitto_pub -h yourserver -t "valetudo/rockrobo/command" -m "stop"
mosquitto_pub -h yourserver -t "valetudo/rockrobo/command" -m "pause"
mosquitto_pub -h yourserver -t "valetudo/rockrobo/command" -m "locate"
mosquitto_pub -h yourserver -t "valetudo/rockrobo/command" -m "return_to_base"
```
