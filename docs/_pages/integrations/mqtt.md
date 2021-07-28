---
title: MQTT
category: Integrations
order: 20
---

# MQTT integration

To make your robot talk to your MQTT broker and integrate with home automation software, such as but not limited to
Home Assistant, openHAB and Node-RED, configure MQTT via Valetudo's web interface (Settings → MQTT).

## Autodiscovery

See the specific integration pages for instructions on how to set up autodiscovery for your home automation software
platform:

- [Home Assistant](./home-assistant-integration)
- [openHAB](./openhab-integration)
- [Node-RED](./node-red)

Other home automation software that follows the [Homie convention](https://homieiot.github.io/) should also be able to
automatically discover your Valetudo instance.

<div style="text-align: center;">
    <a href="https://homieiot.github.io" rel="noopener" target="blank">
        <img src="./img/works-with-homie.svg" />
    </a>
    <br>
    <br>
</div>

## Map

Note that, in order to view the map provided over MQTT, you additionally need
[I Can't Believe It's Not Valetudo](/pages/companion_apps/i_cant_believe_its_not_valetudo.html) to generate PNG maps.
You can then configure it to serve the PNG map over HTTP for openHAB and other software, or install the
[Lovelace Valetudo Card Map](/pages/companion_apps/lovelace_valetudo_map_card.html) for Home Assistant. 

## Custom integrations

If you're planning to use one of the home automation platforms listed above, this is all you need to know to get started.

If you're instead planning to do something more custom, in this document you will find a reference to all MQTT topics
provided by this software. Values such as `<TOPIC PREFIX>` and `<IDENTIFIER>` are those configured in the MQTT
settings page.

{% include alert.html type="tip" content="It is recommended to leave Homie autodiscovery enabled, even if you're not planning to use it, if you want to develop
custom integrations or access the MQTT topics directly: the Homie protocol is very readable and self-documenting.
It will provide additional context and information on how to use specific APIs.


Homie autodiscovery info is best viewed with something like [MQTT Explorer](https://mqtt-explorer.com/).
" %}

### Table of contents

 - [Robot](#robot)
   - [Capabilities](#capabilities)
     - [Basic control (`BasicControlCapability`)](#basiccontrolbasiccontrolcapability)
       - [Operation (`operation`)](#operationoperation)
     - [Consumables monitoring (`ConsumableMonitoringCapability`)](#consumablesmonitoringconsumablemonitoringcapability)
       - [Consumable (minutes) (`<CONSUMABLE-MINUTES>`)](#consumableminutesconsumable-minutes)
       - [Consumable (percent) (`<CONSUMABLE-PERCENT>`)](#consumablepercentconsumable-percent)
       - [Refresh consumables (`refresh`)](#refreshconsumablesrefresh)
     - [Fan speed control (`FanSpeedControlCapability`)](#fanspeedcontrolfanspeedcontrolcapability)
       - [Fan speed (`preset`)](#fanspeedpreset)
     - [Go to location (`GoToLocationCapability`)](#gotolocationgotolocationcapability)
       - [Go to location preset (`go`)](#gotolocationpresetgo)
       - [Presets (`presets`)](#presetspresets)
     - [Locate (`LocateCapability`)](#locatelocatecapability)
       - [Locate (`locate`)](#locatelocate)
     - [Segment cleaning (`MapSegmentationCapability`)](#segmentcleaningmapsegmentationcapability)
       - [Clean segments (`clean`)](#cleansegmentsclean)
     - [Water grade control (`WaterUsageControlCapability`)](#watergradecontrolwaterusagecontrolcapability)
       - [Water grade (`preset`)](#watergradepreset)
     - [Wi-Fi configuration (`WifiConfigurationCapability`)](#wi-ficonfigurationwificonfigurationcapability)
       - [Frequency (`frequency`)](#frequencyfrequency)
       - [IP addresses (`ips`)](#ipaddressesips)
       - [Refresh configuration (`refresh`)](#refreshconfigurationrefresh)
       - [Signal (`signal`)](#signalsignal)
       - [Wireless network (`ssid`)](#wirelessnetworkssid)
     - [Zone cleaning (`ZoneCleaningCapability`)](#zonecleaningzonecleaningcapability)
       - [Presets (`presets`)](#presetspresets)
       - [Start zone preset (`start`)](#startzonepresetstart)
   - [Map data](#mapdata)
     - [Map (`map`)](#mapmap)
     - [Map segments (`segments`)](#mapsegmentssegments)
     - [Raw map data (`map-data`)](#rawmapdatamap-data)
     - [Raw map data with Home Assistant hack (`map-data-hass-hack`)](#rawmapdatawithhomeassistanthackmap-data-hass-hack)
   - [Status](#status)
     - [Attachment state (`AttachmentStateAttribute`)](#attachmentstateattachmentstateattribute)
       - [Dust bin (`dustbin`)](#dustbindustbin)
       - [Mop (`mop`)](#mopmop)
       - [Water tank (`watertank`)](#watertankwatertank)
     - [Battery state (`BatteryStateAttribute`)](#batterystatebatterystateattribute)
       - [Battery level (`level`)](#batterylevellevel)
       - [Battery status (`status`)](#batterystatusstatus)
     - [Vacuum status (`StatusStateAttribute`)](#vacuumstatusstatusstateattribute)
       - [Error description (`error`)](#errordescriptionerror)
       - [Status (`status`)](#statusstatus)
       - [Status detail (`detail`)](#statusdetaildetail)


### State attributes index

- [AttachmentStateAttribute](#attachmentstateattachmentstateattribute)
- [BatteryStateAttribute](#batterystatebatterystateattribute)
- [ConsumableStateAttribute](#consumablesmonitoringconsumablemonitoringcapability)
- [PresetSelectionStateAttribute](#watergradecontrolwaterusagecontrolcapability)
- [StatusStateAttribute](#vacuumstatusstatusstateattribute)


### Home Assistant components index

- [Consumable (minutes) (`sensor.mqtt`)](#consumableminutesconsumable-minutes)
- [Consumable (percent) (`sensor.mqtt`)](#consumablepercentconsumable-percent)
- [Error description (`sensor.mqtt`)](#errordescriptionerror)
- [GoTo Locations (`sensor.mqtt`)](#gotolocationgotolocationcapability)
- [Map data (`camera.mqtt`)](#rawmapdatawithhomeassistanthackmap-data-hass-hack)
- [Map segments (`sensor.mqtt`)](#mapsegmentssegments)
- [Vacuum (`vacuum.mqtt`)](#robot)
- [Water grade (`sensor.mqtt`)](#watergradepreset)
- [Wi-Fi configuration (`sensor.mqtt`)](#wi-ficonfigurationwificonfigurationcapability)
- [Zone Presets (`sensor.mqtt`)](#zonecleaningzonecleaningcapability)


# MQTT API reference

## Robot <a id="robot" />

*Device*

Home Assistant components controlled by this device:

- Vacuum ([`vacuum.mqtt`](https://www.home-assistant.io/integrations/vacuum.mqtt/))



### Capabilities <a id="capabilities" />

#### Basic control (`BasicControlCapability`) <a id="basiccontrolbasiccontrolcapability" />

*Node, capability: [BasicControlCapability](/pages/general/capabilities-overview.html#basiccontrolcapability)*

##### Operation (`operation`) <a id="operationoperation" />

*Property, command, not retained*

- Command topic: `<TOPIC PREFIX>/<IDENTIFIER>/BasicControlCapability/operation/set`
- Command response topic: `<TOPIC PREFIX>/<IDENTIFIER>/BasicControlCapability/operation`
- Data type: [enum](https://homieiot.github.io/specification/#enum) (allowed payloads: `START`, `STOP`, `PAUSE`, `HOME`)





#### Consumables monitoring (`ConsumableMonitoringCapability`) <a id="consumablesmonitoringconsumablemonitoringcapability" />

*Node, capability: [ConsumableMonitoringCapability](/pages/general/capabilities-overview.html#consumablemonitoringcapability)*

{% include alert.html type="warning" content="Some information contained in this document may not be exactly what is sent or expected by actual robots, since different vendors have different implementations. Refer to the table below.

|------+--------|
| What | Reason |
|------|--------|
| Properties | Consumables depend on the robot model and may be discovered at runtime. Always look for changes in `$properties` while `$state` is `init`. |
| Property datatype and units | Some robots send consumables as remaining time, others send them as endurance percent remaining. |
|------+--------|

" %}

Status attributes managed by this node:

- ConsumableStateAttribute

##### Consumable (minutes) (`<CONSUMABLE-MINUTES>`) <a id="consumableminutesconsumable-minutes" />

*Property, readable, retained*

This handle returns the consumable remaining endurance time as an ISO8601 duration. The controlled Home Assistant component will report it as seconds instead.

- Read topic: `<TOPIC PREFIX>/<IDENTIFIER>/ConsumableMonitoringCapability/<CONSUMABLE-MINUTES>`
- Data type: [duration](https://homieiot.github.io/specification/#duration) (in [ISO8601 duration format](https://en.wikipedia.org/wiki/ISO_8601#Durations))

Sample value:

```
PT8H12M0S
```

Home Assistant components controlled by this property:

- Consumable (minutes) ([`sensor.mqtt`](https://www.home-assistant.io/integrations/sensor.mqtt/))



##### Consumable (percent) (`<CONSUMABLE-PERCENT>`) <a id="consumablepercentconsumable-percent" />

*Property, readable, retained*

This handle returns the consumable remaining endurance percentage.

- Read topic: `<TOPIC PREFIX>/<IDENTIFIER>/ConsumableMonitoringCapability/<CONSUMABLE-PERCENT>`
- Data type: [integer percentage](https://homieiot.github.io/specification/#percent) (range: 0 to 100, unit: %)

Sample value:

```json
59
```

Home Assistant components controlled by this property:

- Consumable (percent) ([`sensor.mqtt`](https://www.home-assistant.io/integrations/sensor.mqtt/))



##### Refresh consumables (`refresh`) <a id="refreshconsumablesrefresh" />

*Property, command, not retained*

If set to `PERFORM`, it will attempt to refresh the consumables from the robot. Note that there's no need to do it manually, consumables are refreshed automatically every 30 seconds by default.

- Command topic: `<TOPIC PREFIX>/<IDENTIFIER>/ConsumableMonitoringCapability/refresh/set`
- Command response topic: `<TOPIC PREFIX>/<IDENTIFIER>/ConsumableMonitoringCapability/refresh`
- Data type: [enum](https://homieiot.github.io/specification/#enum) (allowed payloads: `PERFORM`)





#### Fan speed control (`FanSpeedControlCapability`) <a id="fanspeedcontrolfanspeedcontrolcapability" />

*Node, capability: [FanSpeedControlCapability](/pages/general/capabilities-overview.html#fanspeedcontrolcapability)*

Status attributes managed by this node:

- PresetSelectionStateAttribute

##### Fan speed (`preset`) <a id="fanspeedpreset" />

*Property, readable, settable, retained*

This handle allows setting the fan speed. It accepts the preset payloads specified in `$format` or in the HAss json attributes.

- Read topic: `<TOPIC PREFIX>/<IDENTIFIER>/FanSpeedControlCapability/preset`
- Set topic: `<TOPIC PREFIX>/<IDENTIFIER>/FanSpeedControlCapability/preset/set`
- Data type: [enum](https://homieiot.github.io/specification/#enum) (allowed payloads: `off`, `min`, `low`, `medium`, `high`, `turbo`, `max`)

{% include alert.html type="warning" content="Some information contained in this document may not be exactly what is sent or expected by actual robots, since different vendors have different implementations. Refer to the table below.

|------+--------|
| What | Reason |
|------|--------|
| Enum payloads | Different robot models have different fan speed presets. Always check `$format`/`json_attributes` during startup. |
|------+--------|

" %}

Sample value:

```
max
```





#### Go to location (`GoToLocationCapability`) <a id="gotolocationgotolocationcapability" />

*Node, capability: [GoToLocationCapability](/pages/general/capabilities-overview.html#gotolocationcapability)*

Home Assistant components controlled by this node:

- GoTo Locations ([`sensor.mqtt`](https://www.home-assistant.io/integrations/sensor.mqtt/))

##### Go to location preset (`go`) <a id="gotolocationpresetgo" />

*Property, command, not retained*

Use this handle to make the robot go to a configured preset location. It accepts one single preset UUID as a regular string.

- Command topic: `<TOPIC PREFIX>/<IDENTIFIER>/GoToLocationCapability/go/set`
- Command response topic: `<TOPIC PREFIX>/<IDENTIFIER>/GoToLocationCapability/go`
- Data type: [string](https://homieiot.github.io/specification/#string)



##### Presets (`presets`) <a id="presetspresets" />

*Property, readable, retained*

This handle provides a set of configured Go-to-location presets as a JSON object.

- Read topic: `<TOPIC PREFIX>/<IDENTIFIER>/GoToLocationCapability/presets`
- Data type: [string](https://homieiot.github.io/specification/#string) (JSON)

Sample value:

```json
{
  "a9666386-7041-4bd4-a823-ebefa48665eb": {
    "__class": "ValetudoGoToLocation",
    "metaData": {},
    "name": "SpotA",
    "coordinates": {
      "x": 2589,
      "y": 2364
    },
    "id": "a9666386-7041-4bd4-a823-ebefa48665eb"
  },
  "6c74ac84-dfe9-4c4c-8bec-836ff268d630": {
    "__class": "ValetudoGoToLocation",
    "metaData": {},
    "name": "SpotB",
    "coordinates": {
      "x": 2186,
      "y": 2262
    },
    "id": "6c74ac84-dfe9-4c4c-8bec-836ff268d630"
  }
}
```





#### Locate (`LocateCapability`) <a id="locatelocatecapability" />

*Node, capability: [LocateCapability](/pages/general/capabilities-overview.html#locatecapability)*

##### Locate (`locate`) <a id="locatelocate" />

*Property, command, not retained*

- Command topic: `<TOPIC PREFIX>/<IDENTIFIER>/LocateCapability/locate/set`
- Command response topic: `<TOPIC PREFIX>/<IDENTIFIER>/LocateCapability/locate`
- Data type: [enum](https://homieiot.github.io/specification/#enum) (allowed payloads: `PERFORM`)





#### Segment cleaning (`MapSegmentationCapability`) <a id="segmentcleaningmapsegmentationcapability" />

*Node, capability: [MapSegmentationCapability](/pages/general/capabilities-overview.html#mapsegmentationcapability)*

##### Clean segments (`clean`) <a id="cleansegmentsclean" />

*Property, command, not retained*

- Command topic: `<TOPIC PREFIX>/<IDENTIFIER>/MapSegmentationCapability/clean/set`
- Command response topic: `<TOPIC PREFIX>/<IDENTIFIER>/MapSegmentationCapability/clean`
- Data type: [string](https://homieiot.github.io/specification/#string) (format: `segment or segments JSON array`)





#### Water grade control (`WaterUsageControlCapability`) <a id="watergradecontrolwaterusagecontrolcapability" />

*Node, capability: [WaterUsageControlCapability](/pages/general/capabilities-overview.html#waterusagecontrolcapability)*

Status attributes managed by this node:

- PresetSelectionStateAttribute

##### Water grade (`preset`) <a id="watergradepreset" />

*Property, readable, settable, retained*

This handle allows setting the water grade. It accepts the preset payloads specified in `$format` or in the HAss json attributes.

- Read topic: `<TOPIC PREFIX>/<IDENTIFIER>/WaterUsageControlCapability/preset`
- Set topic: `<TOPIC PREFIX>/<IDENTIFIER>/WaterUsageControlCapability/preset/set`
- Data type: [enum](https://homieiot.github.io/specification/#enum) (allowed payloads: `off`, `min`, `low`, `medium`, `high`, `turbo`, `max`)

{% include alert.html type="warning" content="Some information contained in this document may not be exactly what is sent or expected by actual robots, since different vendors have different implementations. Refer to the table below.

|------+--------|
| What | Reason |
|------|--------|
| Enum payloads | Different robot models have different water grade presets. Always check `$format`/`json_attributes` during startup. |
|------+--------|

" %}

Sample value:

```
min
```

Home Assistant components controlled by this property:

- Water grade ([`sensor.mqtt`](https://www.home-assistant.io/integrations/sensor.mqtt/))





#### Wi-Fi configuration (`WifiConfigurationCapability`) <a id="wi-ficonfigurationwificonfigurationcapability" />

*Node, capability: [WifiConfigurationCapability](/pages/general/capabilities-overview.html#wificonfigurationcapability)*

Home Assistant components controlled by this node:

- Wi-Fi configuration ([`sensor.mqtt`](https://www.home-assistant.io/integrations/sensor.mqtt/))

##### Frequency (`frequency`) <a id="frequencyfrequency" />

*Property, readable, retained*

- Read topic: `<TOPIC PREFIX>/<IDENTIFIER>/WifiConfigurationCapability/frequency`
- Data type: [string](https://homieiot.github.io/specification/#string)

Sample value:

```
2.4ghz
```



##### IP addresses (`ips`) <a id="ipaddressesips" />

*Property, readable, retained*

- Read topic: `<TOPIC PREFIX>/<IDENTIFIER>/WifiConfigurationCapability/ips`
- Data type: [string](https://homieiot.github.io/specification/#string)

Sample value:

```
192.168.100.100
```



##### Refresh configuration (`refresh`) <a id="refreshconfigurationrefresh" />

*Property, command, not retained*

- Command topic: `<TOPIC PREFIX>/<IDENTIFIER>/WifiConfigurationCapability/refresh/set`
- Command response topic: `<TOPIC PREFIX>/<IDENTIFIER>/WifiConfigurationCapability/refresh`
- Data type: [enum](https://homieiot.github.io/specification/#enum) (allowed payloads: `PERFORM`)



##### Signal (`signal`) <a id="signalsignal" />

*Property, readable, retained*

- Read topic: `<TOPIC PREFIX>/<IDENTIFIER>/WifiConfigurationCapability/signal`
- Data type: [integer](https://homieiot.github.io/specification/#integer) (unit: dBm)

Sample value:

```json
-26
```



##### Wireless network (`ssid`) <a id="wirelessnetworkssid" />

*Property, readable, retained*

- Read topic: `<TOPIC PREFIX>/<IDENTIFIER>/WifiConfigurationCapability/ssid`
- Data type: [string](https://homieiot.github.io/specification/#string)

Sample value:

```
Valetudo WiFi
```





#### Zone cleaning (`ZoneCleaningCapability`) <a id="zonecleaningzonecleaningcapability" />

*Node, capability: [ZoneCleaningCapability](/pages/general/capabilities-overview.html#zonecleaningcapability)*

Home Assistant components controlled by this node:

- Zone Presets ([`sensor.mqtt`](https://www.home-assistant.io/integrations/sensor.mqtt/))

##### Presets (`presets`) <a id="presetspresets" />

*Property, readable, retained*

This handles provides the list of configured zone presets as a JSON object.

- Read topic: `<TOPIC PREFIX>/<IDENTIFIER>/ZoneCleaningCapability/presets`
- Data type: [string](https://homieiot.github.io/specification/#string) (JSON)

Sample value:

```json
{}
```



##### Start zone preset (`start`) <a id="startzonepresetstart" />

*Property, command, not retained*

This handle accepts a JSON array of zone presets **UUIDs** to start. You can retrieve them from the `/presets` handle.

Sample payload:

```json
[
  "893df403-5920-4392-806e-7067a1e745f8",
  "15fccea0-487c-4a00-94b7-894c8eb7c614"
]
```

- Command topic: `<TOPIC PREFIX>/<IDENTIFIER>/ZoneCleaningCapability/start/set`
- Command response topic: `<TOPIC PREFIX>/<IDENTIFIER>/ZoneCleaningCapability/start`
- Data type: [string](https://homieiot.github.io/specification/#string) (JSON)





### Map data <a id="mapdata" />

*Node*

This handle groups access to map data. It is only enabled if `provideMapData` is enabled in the MQTT config.

#### Map (`map`) <a id="mapmap" />

*Property, readable, retained*

This handle is only enabled if `homie.addICBINVMapProperty` is enabled in the config. It does not actually provide map data, it only adds a Homie autodiscovery property so that 'I Can't Believe It's Not Valetudo' can publish its map within the robot's topics and be autodetected by clients.

ICBINV should be configured so that it publishes the map to this topic.

- Read topic: `<TOPIC PREFIX>/<IDENTIFIER>/MapData/map`
- Data type: [string](https://homieiot.github.io/specification/#string)



#### Raw map data (`map-data`) <a id="rawmapdatamap-data" />

*Property, readable, retained*

- Read topic: `<TOPIC PREFIX>/<IDENTIFIER>/MapData/map-data`
- Data type: [string](https://homieiot.github.io/specification/#string)



#### Raw map data with Home Assistant hack (`map-data-hass-hack`) <a id="rawmapdatawithhomeassistanthackmap-data-hass-hack" />

*Property, readable, retained*

This handle is added automatically if Home Assistant autodiscovery is enabled. It provides a map embedded in a PNG image that recommends installing the Valetudo Lovelace card. 

- Read topic: `<TOPIC PREFIX>/<IDENTIFIER>/MapData/map-data-hass-hack`
- Data type: [string](https://homieiot.github.io/specification/#string)

Home Assistant components controlled by this property:

- Map data ([`camera.mqtt`](https://www.home-assistant.io/integrations/camera.mqtt/))



#### Map segments (`segments`) <a id="mapsegmentssegments" />

*Property, readable, retained*

This property contains a JSON mapping of segment IDs to segment names.

- Read topic: `<TOPIC PREFIX>/<IDENTIFIER>/MapData/segments`
- Data type: [string](https://homieiot.github.io/specification/#string) (JSON)

Sample value:

```json
{}
```

Home Assistant components controlled by this property:

- Map segments ([`sensor.mqtt`](https://www.home-assistant.io/integrations/sensor.mqtt/))





### Status <a id="status" />

#### Attachment state (`AttachmentStateAttribute`) <a id="attachmentstateattachmentstateattribute" />

*Node*

Status attributes managed by this node:

- AttachmentStateAttribute

##### Dust bin (`dustbin`) <a id="dustbindustbin" />

*Property, readable, retained*

This handle reports whether the dust bin is installed. Attachments not compatible with your robot may be included (but set to `false`) and you can safely ignore them.

- Read topic: `<TOPIC PREFIX>/<IDENTIFIER>/AttachmentStateAttribute/dustbin`
- Data type: [boolean](https://homieiot.github.io/specification/#boolean)

Sample value:

```json
true
```



##### Mop (`mop`) <a id="mopmop" />

*Property, readable, retained*

This handle reports whether the mop is installed. Attachments not compatible with your robot may be included (but set to `false`) and you can safely ignore them.

- Read topic: `<TOPIC PREFIX>/<IDENTIFIER>/AttachmentStateAttribute/mop`
- Data type: [boolean](https://homieiot.github.io/specification/#boolean)

Sample value:

```json
false
```



##### Water tank (`watertank`) <a id="watertankwatertank" />

*Property, readable, retained*

This handle reports whether the water tank is installed. Attachments not compatible with your robot may be included (but set to `false`) and you can safely ignore them.

- Read topic: `<TOPIC PREFIX>/<IDENTIFIER>/AttachmentStateAttribute/watertank`
- Data type: [boolean](https://homieiot.github.io/specification/#boolean)

Sample value:

```json
true
```





#### Battery state (`BatteryStateAttribute`) <a id="batterystatebatterystateattribute" />

*Node*

Status attributes managed by this node:

- BatteryStateAttribute

##### Battery level (`level`) <a id="batterylevellevel" />

*Property, readable, retained*

- Read topic: `<TOPIC PREFIX>/<IDENTIFIER>/BatteryStateAttribute/level`
- Data type: [integer percentage](https://homieiot.github.io/specification/#percent) (unit: %)

Sample value:

```json
42
```



##### Battery status (`status`) <a id="batterystatusstatus" />

*Property, readable, retained*

- Read topic: `<TOPIC PREFIX>/<IDENTIFIER>/BatteryStateAttribute/status`
- Data type: [enum](https://homieiot.github.io/specification/#enum) (allowed payloads: `none`, `charging`, `discharging`, `charged`)

Sample value:

```
charging
```





#### Vacuum status (`StatusStateAttribute`) <a id="vacuumstatusstatusstateattribute" />

*Node*

Status attributes managed by this node:

- StatusStateAttribute

##### Status detail (`detail`) <a id="statusdetaildetail" />

*Property, readable, retained*

- Read topic: `<TOPIC PREFIX>/<IDENTIFIER>/StatusStateAttribute/detail`
- Data type: [enum](https://homieiot.github.io/specification/#enum) (allowed payloads: `none`, `zone`, `segment`, `spot`, `target`, `resumable`, `mapping`)

Sample value:

```
segment
```



##### Error description (`error`) <a id="errordescriptionerror" />

*Property, readable, retained*

The error description will only be populated when the robot reports an error. Errors in Valetudo not reported by the robot won't be sent here.

- Read topic: `<TOPIC PREFIX>/<IDENTIFIER>/StatusStateAttribute/error`
- Data type: [string](https://homieiot.github.io/specification/#string)

Home Assistant components controlled by this property:

- Error description ([`sensor.mqtt`](https://www.home-assistant.io/integrations/sensor.mqtt/))



##### Status (`status`) <a id="statusstatus" />

*Property, readable, retained*

- Read topic: `<TOPIC PREFIX>/<IDENTIFIER>/StatusStateAttribute/status`
- Data type: [enum](https://homieiot.github.io/specification/#enum) (allowed payloads: `error`, `docked`, `idle`, `returning`, `cleaning`, `paused`, `manual_control`, `moving`)

Sample value:

```
cleaning
```





