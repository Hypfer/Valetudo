---
title: Valetudo core concepts
category: Development
order: 42
---
# Valetudo core concepts
To accommodate for possibly vastly different vacuum robots, Valetudo features a growing set of structures and concepts
to act as an abstraction for vendor-specific quirks and provide a unified interface for both internal amd external use.

## SerializableEntities
If you're interacting with Valetudo, chances are, that you will see some of these.
These things are designed to be serialized and sent to the UI, the MQTT interface etc.

### RobotState

TBD

### ValetudoMap
Basically everything Map-related can be broken down in two Categories each of which a Map can have many of.
The Map itself keeps track of its size, the pixel size of its layers and various metadata.

Everything is int. Coordinates and size are in cm.

The origin is found on the bottom-left corner like a mathematical coordinate system

#### MapLayer
A MapLayer is an array of pixels in a 2d space. Examples include Walls, Floors and Rooms.

Each MapLayer of a Map shares the coordinate space and pixel Size (in cm) of its Map.

#### MapEntity
Map Entities are everything that is expressed with coordinates such as Go-To Markers, Virtual walls, Paths or no-go areas.

While there are many different types of MapEntities, they are all basically just an bunch of coordinates with some descriptive metadata.

## Core

### ValetudoRobot
A running Valetudo instance has exactly one of these instances.

It's a thing which wraps State and Capabilities together.
Furthermore, it of course chooses the right capabilities for the robot Valetudo is running on.

### Capability
Capabilities are the base class for everything a robot can do which solves the problem that different robots may support
different subsets of all of the vendors possible features which would be hard to implement by simple inheritance.

There's always a generic base class for each feature (e.g. `GoToLocationCapability`) which is extended by multiple vendor-specific
implementations (e.g. `RoborockGoToLocationCapability`, `ViomiGoToLocationCapability` etc).

Capabilities may only be implemented fully so that we can be certain, that a Robot with a `GoToLocationCapability` will always be able to
do everything the `GoToLocationCapability`.
Therefore, its better to split some features into seperate Capabilities, since it's always possible for a robot to have
multiple capabilities but never only half of one.


