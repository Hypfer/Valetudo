---
title: Capabilities Overview
category: General
order: 10
---

# Capabilities overview

To support a growing list of robots with different sub- as well as supersets of features, the concept of capabilities was introduced.

Although the names should be fairly self-explanatory, this page documents what each of them does.
Your robot will probably have multiple but not all of these.


## BasicControlCapability <a id="BasicControlCapability"></a>

Basic robot controls. This should be something that all supported ValetudoRobots implement.

Its methods are:

- start
- pause
- stop
- home


Unfortunately, not all vendors support "stop".
If that's not the case, stop will perform a pause.

## CarpetModeControlCapability <a id="CarpetModeControlCapability"></a>

This capability enables you to enable or disable the automatic suction power increase when the robot detects that it has driven onto a carpet.

## CombinedVirtualRestrictionsCapability <a id="CombinedVirtualRestrictionsCapability"></a>

This capability enables you to configure Virtual Walls + Restricted Zones.

## ConsumableMonitoringCapability <a id="ConsumableMonitoringCapability"></a>

This capability enables you to view and reset the status of the consumables of your robot.

## DoNotDisturbCapability <a id="DoNotDisturbCapability"></a>

This capability enables you to set a DND timespan.
The exact behaviour is dependent on your vendor.

One usual behaviour is that the robot won't continue a cleanup that has been interrupted due to an empty battery until
DND is over. On some robots it also dims the LEDs during the DND phase.

## FanSpeedControlCapability <a id="FanSpeedControlCapability"></a>

This capability enables you to set the suction power of your robot.

## GoToLocationCapability <a id="GoToLocationCapability"></a>

This capability enables you to send your robot to a location on your map. It will simply stay there and do nothing.

One common use-case of this is to send the robot to your bin.

## KeyLockCapability <a id="KeyLockCapability"></a>

This capability enables you to disable control of the robot via the buttons on the devices.
This is useful if you have cats, children and other small creatures that may interact with your robot without thinking about it.

## LocateCapability <a id="LocateCapability"></a>

This capability enables you to let the robot play some kind of sound often at full volume so that you can find it.

Useful if you've completely lost track of where that thing went. It's usually below the couch.

## MappingPassCapability <a id="MappingPassCapability"></a>

Some robots may allow for or even require a mapping pass instead of building the map as they go.
This capability is used to start the mapping process.

Don't be confused if your robot doesn't have this capability.
Usually, they will build the map during cleanup without requiring a seperate mapping pass.

## MapResetCapability <a id="MapResetCapability"></a>

This capability enables you to reset the current map.

## MapSegmentEditCapability <a id="MapSegmentEditCapability"></a>

This capability enables you to join and split detected segments.

If you're new to Valetudo, you might be referring to Segments as Rooms. It's the same thing.
I just didn't like the term room, because they don't necessarily have to actually be rooms.

## MapSegmentRenameCapability <a id="MapSegmentRenameCapability"></a>

This capability enables you to assign names to segments. Naming segments makes it easier to
distinguish them.

## MapSegmentationCapability <a id="MapSegmentationCapability"></a>

This capability enables you to clean detected segments.

If you're new to Valetudo, you might be referring to Segments as Rooms. It's the same thing.
I just didn't like the term room, because they don't necessarily have to actually be rooms.

## MapSnapshotCapability <a id="MapSnapshotCapability"></a>

This capability enables you to list all existing map snapshots as well as restore one of them.

Snapshots are made automatically by the robots firmware. They're basically backups.
Use this if your robot has lost track of where it is and somehow corrupted the map.

## PendingMapChangeHandlingCapability <a id="PendingMapChangeHandlingCapability"></a>

Some robots may occasionally discover a new map and ask for user confirmation to actually use it.
This capability enables you to either accept or reject the new map.

## PersistentMapControlCapability <a id="PersistentMapControlCapability"></a>

This capability enables you to control whether the robot persists its map across cleanups. When
persisted maps are disabled, a new map is generated on each new full cleanup.


## SpeakerTestCapability <a id="SpeakerTestCapability"></a>

This capability enables you to play a test sound at the configured volume level.
It is used to try out the newly set audio volume.

## SpeakerVolumeControlCapability <a id="SpeakerVolumeControlCapability"></a>

This capability enables you to control the volume of the integrated speaker of the robot.

## VoicePackManagementCapability <a id="VoicePackManagementCapability"></a>

This capability enables you to change and upload new voice packs to the robot.

## WaterUsageControlCapability <a id="WaterUsageControlCapability"></a>

This capability enables you to configure the water output flow for mopping.

## WifiConfigurationCapability <a id="WifiConfigurationCapability"></a>

This capability enables you to get the current Wi-Fi connection details (including rssi) as well as reconfigure Wi-Fi.

## ZoneCleaningCapability <a id="ZoneCleaningCapability"></a>

This capability enables you to send your robot to clean one or more (depending on the vendor) zones drawn onto the map.
