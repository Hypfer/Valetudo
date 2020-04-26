---
title: Home Assistant
category: Integrations
order: 20
---
## Home Assistant Integration

To make your Robot talking to your MQTT broker (like Home Assistant), please adapt the config.json file on the robot to your needs (MQTT broker address, username and password of the broker).

```
nano /mnt/data/valetudo/config.json
```


### Example config.json file:

```
{
  "spots": [],
  "areas": [],
  "mqtt": {
    "enabled": true,
    "identifier": "rockrobo",
    "topicPrefix": "valetudo",
    "autoconfPrefix": "homeassistant",
    "broker_url": "mqtt://username:password@192.168.1.22",
    "mapSettings": {
      "drawPath": true,
      "drawCharger": true,
      "drawRobot": true,
      "border": 2,
      "scale": 4
    }
  },
  "dummycloud": {
    "spoofedIP": "203.0.113.1",
    "bindIP": "127.0.0.1"
  },
  "map_upload_host": "http://127.0.0.1"
}
```

In order for this to work, you will also need to enable discovery; for Home Assistant it looks like following:
```
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
```
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
```
          params:
             'zone_ids': ["guest room","study room","bed room","living room"]
```
At the moment you can only send max 5 zones to clean, any more than that will be ignored.

### Example scripts.yaml snippet in Home Assistant for moving to a spot:
(It's basically the same as the zoned cleaning)
```
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