Creating this wiki to discuss the abstraction layer that we want between Robot implementations and other components such as MQTT and the WebInterface.

Interfaces designed here should assume a service / RPC boundary so that we could potentially move them into a separate binary. Consequently data types should ideally use Protocol Buffers (with json encoding for now).

Nothing is set in stone, this is a proposal only.

## Capabilities
We define a central capability interface class that lists and documents various capabilities of robots.
Its booleans are exposed to the web interface that can decide not to offer specific actions.

Examples:
* editable maps (and which parts can be edited)
* rect vs path support of zones
* …

## Command API
The interface that controls what the robot can do.

Examples:
* `goto(Point)`
* `spotClean(Point)`
* `goHome()`
* `startClean(repeated string zone_names)`
* `setCleanParams(CleaningParams)`

## Status API
Robots should send stream updates on their status. Robots that don't support this natively should routinely poll for updates and produce a stream from this.

* `streamStatus() -> [Status]` where Status only sets those fields that changed, initial Status contains all fields

### Status Properties
```
message Status {
  enum RobotStatus { DOCKED; CLEANING; GOING_TO_TARGET; RETURNING; }
  RobotStatus status;
  int battery;  // Battery level in percent, e.g. 80
  // e.g. water level, bin fullness
  repeated Consumable consumables;
  …
}
```

## Map API
Similar to status, we support a one-time map pull and updates.
Web clients can use the `navigator.connection` attribute to specify that they are a mobile client that want’s to save data / less frequent updates.

* `streamMap() -> [Map]` streams map updates as deltas, initial update is a complete map

```
message Map {
  int32 map_id;  // disambiguate in case there are multiple concurrent maps

  // TBD: bitmap or Point→Area mapping, the latter is probably better for diffs(?)
  bytes bitmap;

  // TBD: is Location sufficient here, e.g. we may want to record status like GOTO_TARGET vs CLEANING
  repeated Location robot_path;
  Location charger_location;
  Location robot_location;
  Location goto_target;
}
message Point {
  // mm relative to top left bitmap corner
  int32 x;
  int32 y;
}
message Location {
  Point point;
  int32 orientation; // -180..+180
}
```

The map API should also be sufficient to cover current robot status.

## Map Editing API

* `getZones() -> [Zone]`
* `updateZone(Zone)`
* `splitZone(SplitZoneRequest) -> [Zone]`
* `mergeZones([Zone]) -> Zone`

```
message Zone {
  string name;
  // Wall must have exactly 2 points, Spot must have exactly 1 point.
  enum Type { ROOM; WALL; NOGO; SPOT; AREA; }
  repeated Point bounding_box;
}
```