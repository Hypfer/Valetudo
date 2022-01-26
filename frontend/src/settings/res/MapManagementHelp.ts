export const MapManagementHelp = `
## Map Management

This page allows you to do map-related tasks. What exactly can be done here depends on your model of robot as well
as its firmware.<br/>If you don't see something on this page, it is likely not supported by your robot.

Some robots may require you to manually enable persistent maps before you can do most map-related things.
Others may not even allow disabling of persistent maps because why would you.

There are also some legacy robots, which don't feature persistent maps at all.

### Terminology

Please note that all these concepts need firmware support by your robot.
Not everything might be available on every robot. 

#### Segments

A segment is a partition of the map as decided by the robots' firmware.
Segments enable you to just clean one or more predefined areas. Most firmwares also allow naming them.

You may know them as rooms, however they don't necessarily have to be actual rooms.
There could for example be a segment, which is just the area around your dining table.

On most firmwares, the robot uses the segment data to optimize its navigation and drive the most efficient path.

#### Zones

Zones are just rectangles that you can draw on the map to send the robot there.
Depending on the firmware of your robot, it might accept just one or multiple zones as an input.

#### Zone Presets

Zone Presets are named presets containing one or multiple zones stored by Valetudo,
which can be triggered either by the UI or via MQTT.

#### GoTo Locations

GoTo locations are basically the same as zone presets with the difference being that it is a single spot instead
of an area. You can trigger these either by the UI or via MQTT.



### Frequently asked questions


#### Where is the Multi-Map feature?

Multiple maps are a feature that is inherently linked to a huge increase in code complexity since most functionality
of the robot needs to be aware of not only that there are multiple maps but also, which one is the current one.

These include but are not limited to
- Zone Presets
- GoTo Locations
- Timers
- Cached stuff such as roborock segment names

It gets even worse when there are multiple versions of each map due to stuff like automated snapshots/backups.

This change costs time and therefore money, but it is not just a one-time payment. The increase in complexity is permanent
meaning that the cost of maintaining the codebase is also increased permanently.

Even if there was a PR to reduce the initial cost, it would still not be merged due to its permanent impact
on the running costs.<br/>
Implementing multi-floor support was already investigated multiple times with each iteration resulting in the discovery
of even more things that make this hard to pull off using Valetudo.

A lot of stuff in the robots core operation logic assumes that the cloud is always available with a permanent storage
of all data such as maps uploaded to it in some database or similar.
Sometimes, the robot will report to the cloud that it won't upload the requested map file again as instead
the cloud should use file with ID XYZ. This works fine when the cloud is actually the cloud but breaks entirely 
when the "cloud" is Valetudo with no persistent storage of uploads.

Adding persistence also isn't feasible, because you'd need to store everything all the time as you can never know
if an uploaded artifact might become relevant later. There are simply not enough resources to do that on the robot.


Furthermore, since vacuum robots cannot climb stairs, the whole multi-floor experience is just objectively inferior
as you loose the ability to do all the fancy automation stuff with robots starting to clean a room as soon as everyone has left etc.


And lastly, as of now (2021-10-23), you can get a factory-new robot supported by Valetudo for less than 150€.<br/>
If you own a multi-floor home, there is absolutely no possibility that you're unable to afford that.

`;
