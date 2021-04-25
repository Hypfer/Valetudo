---
title: MQTT
category: Development
order: 43
---

# MQTT

Valetudo supports publishing status data and receiving commands from MQTT.

The following autodiscovery protocols are supported:

- Home Assistant
- Homie

They are both optional and mutually compatible: you can enable both at the same time or none at all.

## Main concepts

Since the MQTT code is heavily based on the capabilities system you may want to first give a look to how capabilities,
status attributes, and the robot object work.

The MQTT OOP structure is heavily influenced by the Homie convention. This page will also contain lots of references to
it, so make sure you grasp the fundamental concepts of the convention before proceeding further:

- Overview: [https://homieiot.github.io/](https://homieiot.github.io/)
- Specification: [https://homieiot.github.io/specification/spec-core-v4_0_0/](https://homieiot.github.io/specification/spec-core-v4_0_0/)

### Responsibilities

To keep the codebase maintainable and prevent entire classes of potential issues, the code tries to define and restrict
the responsibilities of each component as follows:

- `MqttHandle` and subclasses
    - Provide infrastructure to receive events from status attributes and send commands to capabilities
    - Manage Homie attributes
    - Parse and validate incoming and outgoing payloads
- `HassComponent` and subclasses
    - Provide infrastructure to allow sharing as much data as possible with `MqttHandle`s
    - Manage Hass autoconfiguration payloads
- `MqttController`
    - Handle the MQTT configuration
    - Handle all aspects of the MQTT communication, such as connection, disconnection, publication, subscriptions
    - Enforce a well-defined procedure for Homie state changes and reconfiguration
    - Handle and dispatch events that can't be handled by handles directly
- `HassController`
    - Act as a middleware between `MqttController` and `HassComponent`s

### Handles

Handles are subclasses of `MqttHandle`. They are designed to map exactly to the levels of the Homie convention topology.
Specifically:

- `RobotMqttHandle` ⇒ Homie device
- `NodeMqttHandle` ⇒ Homie node
- `PropertyMqttHandle` ⇒ Homie property

Two more classes are present that further extend from these and bridge the handles to Valetudo's internals:

- `RobotStateNodeMqttHandle` maps to `StatusStateAttribute`
- `CapabilityMqttHandle` maps to `Capability`
- (`RobotMqttHandle` maps to `ValetudoRobot`)

#### Handle tree and data publication

Handles are assigned into a tree structure:

- `RobotMqttHandle`, being the root handle, registers to the `MqttController`
- `NodeMqttHandle`s register to `RobotMqttHandle`
- `PropertyMqttHandle`s register to `NodeMqttHandle`

This structure simplifies and unifies publication to the MQTT broker, Instead of publishing data directly, any handle
may "refresh" itself.

When a handle is refreshed it will ask the `MqttController` to retrieve a fresh payload from it and publish it to its
designated topic.

Refreshing is recursive: whenever a handle is refreshed all children are refreshed as well. Attached Home Assistant
components will also be refreshed, but we will discuss this later.

#### The robot handle

`RobotMqttHandle` is special since it is the root handle. It maps to a Homie device. It is mainly responsible for
checking which capabilities the robot supports and registering the corresponding handles.

It will also subscribe to the robot status and register matching handles **as soon as the corresponding attributes are
added** (therefore it's normal if they don't show up until the robot is fully connected and the status is polled).

Finally, it handles the registration of `MapNodeMqttHandle`, which as the name suggests provides map data.

#### The state handles

`RobotStateNodeMqttHandle` children all map to Homie nodes. Their peculiarity is that they provide infrastructure to
subscribe to the robot state.

This is accomplished by providing a list of status attribute matchers, which the handle will subscribe to.

When a status event occurs, the handle and all its children are refreshed.

#### The capability handles

`CapabilityMqttHAndle` children also map to Homie nodes. The class itself inherits from `RobotStateNodeMqttHandle`,
therefore it is as well able to subscribe to robot status events.

It is encouraged, whenever possible, to handle status data in a capability handle as opposed to a status handle whenever
actions performed on the capability will be reflected into and match exactly to a status attribute event.

This is true, for example, for both `IntensityPresetCapability`s, since setting a preset will usually result in the same
value being reflected back to the status attribute: you send `low` and you get back `low`.

This is NOT true, for example, for `BasicControlCapability`. While actions performed on it will directly affect
`StatusStateAttribute`, the status event won't match exactly: you perform `START` but you get back `CLEANING`.

#### The property handles

`PropertyMqttHandle`, as the name suggests, maps to Homie properties. However, unlike the previously discussed handles,
property handles do not have subclasses and should not be subclassed.

Property handles are in fact defined and registered in-line in the capability/status handle constructors. All data is
provided as parameters to the constructor.

These handles handle the actual data to be published and receive commands. However, they never interact directly with
the MQTT client. They instead must be provided with at least one of the following callbacks: a `getter` to retrieve
fresh data to be published; a `setter` to perform operations with the data received from MQTT.

When a `setter` callback is provided, property handles will be subscribed to a `/set` topic.

When a `setter` is provided but a `getter` is not provided, the property will act as a *command property* according to
the Homie convention: the data received in the `/set` topic will automatically be reflected back to the main topic to
acknowledge the command.

### Home Assistant components

Home Assistant uses a very different workflow. Instead of defining a structure, it defines components which may or may
not map to some capabilities' behavior.

In some instances it will try to adapt to an existing MQTT structure and allow you to provide topics and payloads for
accomplishing different tasks. In some other cases it will try to impose its own structure.

This makes it difficult to share data with the previously defined structure. However, Valetudo provides enough
abstraction to make this easier: `HassComponent`.

Home Assistant components may subscribe to topics. However, this should be avoided when possible: most features can and
should be implemented by providing Hass with the handle topics.

#### Components and the handle tree

Components are not handles, they are a separate entity. However, in order to share data with handles, they are attached
to and managed by the handle they share information with.

Components may be attached to any type of handle, from the robot handle to the property handle. For instance, the map
component is attached to the map handle.

Whenever an handle is refreshed, the attached Hass components are refreshed as well.

#### Sharing topics and data through anchors

Some components are trickier. For example, the `VacuumHassComponent` is attached to the robot handle since that's what
it shares most data with. However, it also needs access to the fan speed and a reference to the `BasicControlCapability`
command topic in order to send cleaning control commands.

This is accomplished using `HassAnchor`.

`HassAnchor` is a utility to share data from the handle that manages some type of information to the hass component that
needs it.

There are two types of `HassAnchor`: plain anchors and topic references. The implementation is exactly the same, the
distinction has been put in place, once again, to separate responsibilities: "plain" anchors may only be used in
payloads, topic references may only be used in autoconfiguration payloads.

`HassAnchor`s can be thought of as fancy "template variables". Hass component payloads are in fact provided as regular
JavaScript objects. For any value that is not immediately available, an `HassAnchor` may be retrieved and used in its
place.

Of course, the value isn't going to jump into existence on its own: some other component needs to provide it. This is a
responsibility of handles: whenever they share some value with a hass component, they should also `post()` it into the
anchor every time they retrieve it for their own needs.

`HassAnchor`s are eventful: whenever a handle posts a value into an anchor, the hass component that uses it is
automatically refreshed and its payload published to MQTT.

If for whatever reason an anchor doesn't hold any value when the hass component payload is requested for publication,
the publication will be delayed. This means that **you should only use anchors if you are sure they will be populated**,
otherwise the hass component will stay in a limbo forever.

## Dos and don'ts

Here's a bunch of things to keep in mind when adding new MQTT handles and Home Assistant components.

- **Don't** try to bypass the API restrictions: if you find it hard to get something done you're probably not doing it
  correctly
- **Do** suggest and discuss API changes that accommodate your use case

----

- **Don't** implement something only for Homie or for Home Assistant
- **Do** take your time and do things properly

----

- **Don't** abuse `HassAnchor`
- **Do** try to define your hass component close to its handle, so that most data you need will be in the same scope

----

- **Don't** link Home Assistant fields to Homie `$attributes` - they won't be available if Homie is disabled
- **Do** define a payload for the Home Assistant component with all the data you need, using anchors if needed

## Troubleshooting

This section does not describe general MQTT troubleshooting, but rather troubleshooting of problems that can occur when
writing new code.

### A status/capability handle does not get published

Status handles are only published once the `StatusAttribute` they subscribe to first appears. If it does appear, but the
handle isn't published, you may have an incorrect attribute matcher.

Both status and capability handles have to be registered into the designated lists inside the `HandleMappings.js` file
for them to be loaded.

### Anchors are not updating but handles are

You can enable `debug.debugHassAnchors` in the configuration and set the log level to `trace`. It will print a report
whenever an anchor is blocking publication for a Hass component.

