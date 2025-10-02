---
title: Capabilities Overview
category: Usage
order: 11
---

# Capabilities overview

To support a growing list of robots with different sub- as well as supersets of features, the concept of capabilities was introduced.

Although the names should be fairly self-explanatory, this page documents what each of them does.
Your robot will probably have multiple but not all of these.

## AutoEmptyDockAutoEmptyIntervalControlCapability <a id="AutoEmptyDockAutoEmptyIntervalControlCapability"></a>

In its most basic implementation, this capability allows enabling or disabling the automatic auto-emptying into the dock after a cleanup.

On more sophisticated firmwares, options such as only doing it once every few cleanups or even doing it multiple times per cleanup might be available.

## AutoEmptyDockManualTriggerCapability <a id="AutoEmptyDockManualTriggerCapability"></a>

This capability is used to manually trigger the auto-emptying of the robot's dustbin into the auto-empty-dock.

## BasicControlCapability <a id="BasicControlCapability"></a>

Basic robot controls. This should be something that all supported ValetudoRobots implement.

Its methods are:

- start
- pause
- stop
- home


Unfortunately, not all vendors support "stop".
If that's not the case, stop will perform a pause.

## CameraLightControlCapability <a id="CameraLightControlCapability"></a>

Some robots might come with a light source, improving AI Camera obstacle detection in low-light conditions.
This capability can enable or disable that light source.

## CarpetModeControlCapability <a id="CarpetModeControlCapability"></a>

This capability enables you to enable or disable the automatic suction power increase when the robot detects that it has driven onto a carpet.

## CarpetSensorModeControlCapability <a id="CarpetSensorModeControlCapability"></a>

Some robots - usually those with advanced mopping capabilities - come with a dedicated sensor - usually ultrasonic - used
to detect carpets. This capability allows you to select how the robot should deal with carpets detected during navigation.

Depending on your robot, possible options can include
- Ignore and just drive over it
- Avoid
- Lift the mop

## CollisionAvoidantNavigationControlCapability <a id="CollisionAvoidantNavigationControlCapability"></a>

Some robots and firmwares allow the user to tweak the robots navigation a little.
As the name suggests, this capability provides a toggle that allows to select between less bumps into things or less risk of
missed areas during cleaning.

## CombinedVirtualRestrictionsCapability <a id="CombinedVirtualRestrictionsCapability"></a>

This capability enables you to configure Virtual Walls + Restricted Zones.

## ConsumableMonitoringCapability <a id="ConsumableMonitoringCapability"></a>

This capability enables you to view and reset the status of the consumables of your robot.

## CurrentStatisticsCapability <a id="CurrentStatisticsCapability"></a>

This capability provides statistics such as covered area or runtime of the current or most recent cleanup job.

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

## HighResolutionManualControlCapability <a id="HighResolutionManualControlCapability"></a>

Compared to the `ManualControlCapability` that uses "digital" movement, this one uses "analog" inputs.
It offers much more precise controls over the robot.

## KeyLockCapability <a id="KeyLockCapability"></a>

This capability enables you to disable control of the robot via the buttons on the devices.
This is useful if you have cats, children and other small creatures that may interact with your robot without thinking about it.

## LocateCapability <a id="LocateCapability"></a>

This capability enables you to let the robot play some kind of sound often at full volume so that you can find it.

Useful if you've completely lost track of where that thing went. It's usually below the couch.

## ManualControlCapability <a id="ManualControlCapability"></a>

This capability allows manually driving around the robot like an RC car with tank controls.

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

Snapshots are made automatically by the robots' firmware. They're basically backups.
Use this if your robot has lost track of where it is and somehow corrupted the map.

## MappingPassCapability <a id="MappingPassCapability"></a>

Some robots may allow for or even require a mapping pass instead of building the map as they go.
This capability is used to start the mapping process.

Don't be confused if your robot doesn't have this capability.
Usually, they will build the map during cleanup without requiring a separate mapping pass.

## MopDockCleanManualTriggerCapability <a id="MopDockCleanManualTriggerCapability"></a>

This capability allows you to start and stop cleaning of the mops in the mop dock.

## MopDockDryManualTriggerCapability <a id="MopDockDryManualTriggerCapability"></a>

This capability allows you to start and stop drying of the mops in the mop dock.

## MopDockMopAutoDryingControlCapability <a id="MopDockMopAutoDryingControlCapability"></a>

A simple toggle, allowing to enable or disable whether the Mop Dock should automatically start drying the mops after a cleanup.

## MopDockMopWashTemperatureControlCapability <a id="MopDockMopWashTemperatureControlCapability"></a>

Some Mop Docks come with a water heater that may even offer various levels of heating for the water used to wash the mops.
Since heating water is one of the most energy intensive thing one can do, vendors started providing options here.

## MopExtensionControlCapability <a id="MopExtensionControlCapability"></a>

Some robots are able to extend the mop outwards, so that they can mop closer to walls.
This capability allows for enabling or disabling that feature.


## MopExtensionFurnitureLegHandlingControlCapability <a id="MopExtensionFurnitureLegHandlingControlCapability"></a>

This is an extension of the mop extension feature, also allowing to optionally extend the mop to mop closer to legs of chairs, tables and similar furniture.

## MopTwistControlCapability <a id="MopTwistControlCapability"></a>

If your robot can't extend its mop to reach closer to the walls, it might be able to twist to achieve the same.
Or, if it can extend it, it might still be able to twist to reach below some furniture overhangs.

Since this makes the cleanup take longer, vendors offer a toggle for it.

## ObstacleAvoidanceControlCapability <a id="ObstacleAvoidanceControlCapability"></a>

Some robots featuring obstacle detection and avoidance using technology such as fully local AI object detection or lasers
give you the option to completely disable that. This can be useful if it wrongly detects and avoids obstacles where there are none.

## ObstacleImagesCapability <a id="ObstacleImagesCapability"></a>

This capability provides images of the Obstacles discovered by the robot during a cleanup task.
When enabled, these can be viewed by clicking on the obstacle icons on the map.

## OperationModeControlCapability <a id="OperationModeControlCapability"></a>

This capability allows you to select if the robot should only vacuum, only mop or both.

## PendingMapChangeHandlingCapability <a id="PendingMapChangeHandlingCapability"></a>

Some robots may occasionally discover a new map and ask for user confirmation to actually use it.
This capability enables you to either accept or reject the new map.

## PersistentMapControlCapability <a id="PersistentMapControlCapability"></a>

This capability enables you to control whether the robot persists its map across cleanups. When
persisted maps are disabled, a new map is generated on each new full cleanup.

## PetObstacleAvoidanceControlCapability <a id="PetObstacleAvoidanceControlCapability"></a>

Robots featuring fully local AI camera object detection for obstacle avoidance may feature a special AI model specifically
tuned to detect pet feces that would otherwise lead to catastrophic and fatal results.

Because of that, these models are a bit trigger-happy and therefore may cause detection of objects where there are none
which is why the firmware allows robot owners without pets to disable that and get less ghost obstacles in return.

## QuirksCapability <a id="QuirksCapability"></a>

Valetudo aims to be a generic abstraction. That means that it tries to unify vendor-specific commands and concepts
into generic ones so that you don't have to worry about which brand of robot you buy as Valetudo will work
the same on all of them.

Sometimes however there might be things that only one Vendor or even only one model of robot does.
Adding that to the core infrastructure of Valetudo wouldn't make sense as the generic interface would soon become an
interface specific to one particular robot which would go against the core goal of being vendor-agnostic.

Still, limiting features to the least common denominator may at times also not be ideal.
This is where quirks come in.

A quirk is a vendor, robot or firmware-specific tunable that doesn't fit into Valetudo (yet?).

Think of quirks as some kind of convenience playground testing section.
Usually, they will be tunables that you change once and then likely never touch again.

## SpeakerTestCapability <a id="SpeakerTestCapability"></a>

This capability enables you to play a test sound at the configured volume level.
It is used to try out the newly set audio volume.

## SpeakerVolumeControlCapability <a id="SpeakerVolumeControlCapability"></a>

This capability enables you to control the volume of the integrated speaker of the robot.

## TotalStatisticsCapability <a id="TotalStatisticsCapability"></a>

This capability provides all-time statistics such as covered area, cleanup count or total runtime.
Depending on your robot, these might not survive a factory reset.

## VoicePackManagementCapability <a id="VoicePackManagementCapability"></a>

This capability enables you to change and upload new voice packs to the robot.

## WaterUsageControlCapability <a id="WaterUsageControlCapability"></a>

This capability enables you to configure the water output flow for mopping.

## WifiConfigurationCapability <a id="WifiConfigurationCapability"></a>

This capability enables you to get the current Wi-Fi connection details (including rssi) as well as reconfigure Wi-Fi.

## ZoneCleaningCapability <a id="ZoneCleaningCapability"></a>

This capability enables you to send your robot to clean one or more (depending on the vendor) zones drawn onto the map.
