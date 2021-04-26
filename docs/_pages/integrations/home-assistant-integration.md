---
title: Home Assistant
category: Integrations
order: 21
---
## Home Assistant Integration

### MQTT Broker
At first you need a MQTT Broker (if not already present).
Install and configure the "Mosquitto Broker" Addon from the Official Addon Repository withing HomeAssistant. Follow the documentation of the addon and don't forget to create a dedicated user for this addon.

### Valetudo Settings
When Addon and MQTT Broker Integration is present, you can do the Valetudo MQTT configuration (Settings -> MQTT).
Enable MQTT, Add the Server IP of your Homeassistant instance as "Server" option. For Username/Password you should now use the dedicated user which was previous created for the Homeassistant MQTT Broker. Ensure the Autodiscovery Settings (For Homeassistant AND Homie) are enabled. Then Save the Settings to let the magic happen.

### Homeassistant
Homeassistant will now discover lots of entities you can now read and use.
Some basic functions like starting, stopping or returning to base can now be called with the appropriate homeassistant vacuum integration.
Since Valetudo 2021.04.0 "vacuum.send_command" is no longer supported (which was used for things like segment cleaning or goto location).
Now the MQTT publish Homeassistant Component must be used for advanced commands.

### Examples:

#### Basic Services

Assuming Robot entity = vacuum.robot

Starting and stopping the robot
```
service: vacuum.stop
target:
  entity_id: vacuum.robot
```

```
service: vacuum.start
target:
  entity_id: vacuum.robot
```

#### Advanced Services

For using the Homeassistant MQTT Publish component, you need to know the topic prefix and the identifier. These Settings can be found in the Valetudo MQTT settings.

For these examples we are assuming topic prefix=valetudo and identifier=robot

For the segment cleaning capability, you should first go ahead to valetudo and rename your segments (rooms). Then you can go and check out the entity "sensor.map_segments" which provides a list of your rooms like this:

```
'16': livingroom
'17': kitchen
'18': floor
'19': office
'20': bathroom
```

The resulting Homeassistant Service to clean the livingroom would then look like this:

```
service: mqtt.publish
data:
  topic: valetudo/robot/MapSegmentationCapability/clean/set
  payload: '16'
```

For more features check out the [MQTT documentation](/pages/integrations/mqtt.html).


### PNG map generation

If you on Hass.io and want the map also on your dashboards of Home Assistant, use the [ICantBelieveItsNotValetudo-Addon](https://github.com/Poeschl/Hassio-Addons/tree/master/ICantBelieveItsNotValetudo).
