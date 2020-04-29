---
title: Home Assistant
category: Integrations
order: 20
---
## Home Assistant Integration

![image](./img/valetudo_device_homeassistant.png)

To make your Robot talking to your MQTT broker (like Home Assistant), please adapt the config.json file on the robot to your needs (MQTT broker address, username and password of the broker).

```
nano /mnt/data/valetudo/config.json
```


### Example config.json file:

```json
{
  "spots": [],
  "areas": [],
  "mqtt": {
    "enabled": true,
    "identifier": "rockrobo",
    "topicPrefix": "valetudo",
    "autoconfPrefix": "homeassistant",
    "broker_url": "mqtt://username:password@192.168.1.22",
    "provideMapData": true,
    "caPath": "",
    "qos": 0
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


In order for this to work, you will also need to enable discovery; for Home Assistant it looks like following:
```yaml
mqtt:
  discovery: true
  discovery_prefix: homeassistant
```
(there is no need to enable vacuum.mqtt, it will be enabled automagically).

### Example commands

Here are some commands you can publish to control the vacuum:

```
mosquitto_pub -h yourserver -t "valetudo/rockrobo/command" -m "locate"
mosquitto_pub -h yourserver -t "valetudo/rockrobo/command" -m "start"
mosquitto_pub -h yourserver -t "valetudo/rockrobo/command" -m "stop"
mosquitto_pub -h yourserver -t "valetudo/rockrobo/command" -m "pause"
mosquitto_pub -h yourserver -t "valetudo/rockrobo/command" -m "locate"
mosquitto_pub -h yourserver -t "valetudo/rockrobo/command" -m "return_to_base"
```


### Example scripts.yaml snippet in Home Assistant for zoned cleaning:
```yaml
vacuum_guest_room:
     alias: "vacuum guest room"
     sequence:
       - service: vacuum.send_command
         data:
           entity_id: 'vacuum.rockrobo'
           command: 'zoned_cleanup'
           params:
             'zone_ids': ['guest room']
```

For multiple zones:
```yaml
          params:
             'zone_ids': ["guest room","study room","bed room","living room"]
```
At the moment you can only send max 5 zones to clean, any more than that will be ignored.

### Example scripts.yaml snippet in Home Assistant for moving to a spot:
(It's basically the same as the zoned cleaning)
```yaml
move_vacuum_to_bin_emptying_location:
     alias: "Move Vacuum to bin emptying location"
     sequence:
       - service: vacuum.send_command
         data:
           entity_id: 'vacuum.rockrobo'
           command: 'go_to'
           params:
             'spot_id': 'KitchenBin'
```

### PNG map generation

If you on Hass.io and want the map also on your dashboards of Home Assistant, use the [ICantBelieveItsNotValetudo-Addon](https://github.com/Poeschl/Hassio-Addons/tree/master/ICantBelieveItsNotValetudo).
