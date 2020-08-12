---
title: Home Assistant
category: Integrations
order: 21
---
## Home Assistant Integration

![image](./img/valetudo_device_homeassistant.png)

You need to [connect valetudo to your Home Assistant MQTT Broker](./mqtt.html).

Also enable discovery in Home Assistant like following:

```yaml
mqtt:
  discovery: true
  discovery_prefix: homeassistant
```

(there is no need to enable vacuum.mqtt, it will be enabled automagically).

### Example scripts.yaml snippet in Home Assistant for zoned cleaning

```yaml
vacuum_guest_room:
     alias: "vacuum guest room"
     sequence:
       - service: vacuum.send_command
         data:
           entity_id: 'vacuum.robot'
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

### Example scripts.yaml snippet in Home Assistant for moving to a spot

(It's basically the same as the zoned cleaning)

```yaml
move_vacuum_to_bin_emptying_location:
     alias: "Move Vacuum to bin emptying location"
     sequence:
       - service: vacuum.send_command
         data:
           entity_id: 'vacuum.robot'
           command: 'go_to'
           params:
             'spot_id': 'KitchenBin'
```

### Example scripts.yaml snippet in Home Assistant for segment cleaning

(It's basically the same as the zoned cleaning and moving to a spot)

```yaml
clean_living_room_and_kitchen:
     alias: "Clean Living room and kitchen"
     sequence:
       - service: vacuum.send_command
         data:
            entity_id: 'vacuum.robot'
            command: 'segment_cleanup'
            params:
             'segment_ids': [13,37]
```


### PNG map generation

If you on Hass.io and want the map also on your dashboards of Home Assistant, use the [ICantBelieveItsNotValetudo-Addon](https://github.com/Poeschl/Hassio-Addons/tree/master/ICantBelieveItsNotValetudo).

### Automation for Valetudo version upgrade.

You need two sensors:
```yaml
- platform: mqtt
  name: version_valetudo
  state_topic: "homeassistant/vacuum/valetudo_XXXXXX/config"
  value_template: "{{ value_json.device['sw_version'] }}"
  scan_interval: 21600

- platform: command_line
  name: latest_valetudo
  command: curl -s https://github.com/Hypfer/Valetudo/releases/latest | cut -d'"' -f2 | rev | cut -d'/' -f1 | rev
  scan_interval: 21600
```
In Automations:

```yaml
- id 'Your ID'
  alias: New Valetudo SW Version
  description: ''
  trigger:
  - platform: template
    value_template: '{{ states(''sensor.latest_valetudo'') != states(''sensor.version_valetudo''
      ) }}'
  condition: []
  action:
  - data:
      message: The new version {{ states('sensor.latest_valetudo') }} is available
      title: '*Valetudo upgrade pending*'
    service: notify.telegram
  - data:
      message: '{{ states(''sensor.latest_valetudo'') }}'
      title: Valetudo upgrade pending
    service: persistent_notification.create
  mode: single
...
```
