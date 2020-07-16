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

