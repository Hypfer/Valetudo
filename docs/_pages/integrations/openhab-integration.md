---
title: openHAB
category: Integrations
order: 23
---

# openHAB integration

[openHAB](https://www.openhab.org/) supports MQTT autodiscovery using the Homie convention. Make sure MQTT is configured
properly and that Homie autodiscovery is enabled (see [MQTT](./mqtt)).

<div style="text-align: center;">
    <a href="https://homieiot.github.io" rel="noopener" target="blank">
        <img src="./img/works-with-homie.svg" />
    </a>
    <br>
    <br>
</div>

Unlike Home Assistant, openHAB does not come with a vacuum widget out of the box. It does, however, allow adding custom
widgets for complex devices.

A custom developed widget is available at the end of the page. This document tries to explain in enough detail how to
add a Valetudo robot to openHAB with the goal of minimizing inconsistencies between different users setups. This will
make it easier to share custom widgets among the Valetudo community.

{% include alert.html type="note" content="This document applies only to openHAB 3.0 and newer. openHAB 2 and 1 are out
of scope.
Homie must also be enabled in Valetudo.

" %}

<div style="text-align: center">

<img src="./img/oh-widget-large.png"> <img src="./img/oh-widget-large-light.png">
<img src="./img/oh-widget-compact.png"> <img src="./img/oh-widget-xsmall-light.png">

</div>

## Adding the robot

1. Before starting, go to Valetudo and refresh the status, navigate a few pages. This will ensure that all MQTT topics
   are correctly populated and ready for openHAB.
2. You need to install the official MQTT binding if you don't have it installed already: you can install it from
   Settings → Add-ons → Bindings -> [+ button] → MQTT Binding.
3. Create an MQTT broker by navigating to Things → [+ button] → MQTT Binding → MQTT Broker, then configure the same
   broker that you configured for Valetudo.
4. Go back to Things → [+ button] → MQTT Binding, but this time, if you configured the broker correctly, you should]
   find your Valetudo instance on top, with a subtitle `mqtt:homie300`. Choose a unique name for your robot.
5. Now navigate to "Model"
   {% include alert.html type="tip" content="If you haven't configured your semantic model, you should probably give it
   a shot, it simplifies setting up devices by orders of
   magnitude. [Docs](https://www.openhab.org/docs/tutorial/model.html)." %}
6. Select the room you want to add your robot to, then click "Create Equipment from Thing" and select your newly created
   Valetudo Homie thing. Fill in the name, etc, then scroll towards the bottom before saving.
7. Enable and configure the channels you want to import from the vacuum. You don't have to select all of them, and you
   don't need to add all the items you configure to your semantic model (to not add them to the model, set the
   \"Semantic class\" to \"None\"). The table below shows the recommended channels to enable in order to set up the
   provided custom widget.
   
   {% include alert.html type="important" content="Do not change the \"Name\" field if you want to use the custom
   widget!
   
   " %}
   {% include alert.html type="warning" content="Do not add the map channel. A workaround is in the works but, at the
   moment, enabling it will fill up your disk since openHAB will log it at every update and it won't even display.
   
   " %}
   
   | Channel        | Type      | Category     | Semantic class | Semantic Property | Notes        |
   | -------------- | --------- | ------------ | -------------- | ----------------- | ------------ |
   | Dust bin       | Switch    |              | Point          | Presence          |              |
   | Water tank     | Switch    |              | Point          | Presence          | Optional     |
   | Mop            | Switch    |              | Point          | Presence          | Optional     |
   | Fan speed      | String    | fan          | Setpoint       | Level             |              |
   | Water grade    | String    | water        | Setpoint       | Level             | Optional     |
   | Status         | String    |              | Point          | None              |              |
   | Status detail  | String    |              | Point          | None              |              |
   | Battery level  | Number    | batterylevel | Point          | Level             |              |
   | Battery status | String    | battery      | Point          | None              |              |
   | Operation      | String    |              | Point          | None              |              |
   | Clean segments | String    |              | None           | None              | Optional     |
   | Locate         | String    |              | Point          | None              | Optional     |

   {% include alert.html type="tip" content="If you need to add more channels later you can always select your vacuum
   from the semantic model, then click \"Create Points from Thing\".
   
   " %}

8. Once the vacuum is added and linked, we are ready to add the custom widget. Go to Developer Tools → Widgets →
   [+ button] and paste the widget code at the end of this page.
   
   You can test it by selecting "Set Props" on the bottom, and adding the settings. You can also change it as you wish.
   
## Enabling the widget

### In the overview page

1. Navigate to Settings → Pages → Overview.
2. Click "Add Row", then "Add Column".
3. In the new slot that has been created, click the + sign, scroll down to "Personal widgets" and select the newly 
   created widget
4. Click the options menu on the top right of the widget and select "Configure widget"
5. Make sure you select the main vacuum item for "Vacuum item"
6. Save the page

### In the Model page (standalone widget)

1. Navigate to Model and find your vacuum item. Select it.
2. Click "Add metadata"
3. Select "Default Standalone Widget"
4. Select your newly created widget in "Widget", then configure the options below.
5. Make sure you select the main vacuum item for "Vacuum item"



## Custom widget code

```yaml
uid: vacuum_widget
tags:
  - card
props:
  parameters:
    - context: item
      description: Vacuum group item - Must be created from the Homie autodiscovery with default names for all sub-items
      label: Vacuum item
      name: item
      required: true
      type: TEXT
      groupName: general
    - context: url
      description: Optional map image URL
      label: Map URL
      name: map_url
      required: false
      type: TEXT
      groupName: general
    - context: url
      description: Link to your Valetudo instance
      label: Valetudo URL
      name: valetudo_url
      required: false
      type: TEXT
      groupName: general
    - context: page
      description: Optional floor plan page to show a button that links to it
      label: Floor plan page
      name: floorplan
      required: false
      type: TEXT
      groupName: general
    - description: A comma-separated list of "SEGMENT_ID=Name" values, such as "10=Kitchen, 11=Bedroom
      label: Segments
      name: segments
      required: false
      type: TEXT
      groupName: general
    - description: If set it will be displayed next to the status
      label: Title
      name: title
      required: false
      groupName: display
    - description: If enabled, fan speed and water grade selection will be available in a menu. If not enabled, buttons will be shown in the widget.
      label: Compact fan speed / water grade
      name: compact
      required: true
      type: BOOLEAN
      groupName: display
    - description: Hide attachments such as dust bin, water tank.. from the widget
      label: Hide attachments
      name: hide_attachments
      required: false
      type: BOOLEAN
      groupName: display
    - description: Hide locate button from widget
      label: Hide locate
      name: hide_locate
      required: false
      type: BOOLEAN
      groupName: display
  parameterGroups:
    - name: general
      label: General
    - name: display
      label: Display options
timestamp: Apr 21, 2021, 8:47:25 PM
component: f7-card
slots:
  default:
    - component: f7-row
      config:
        style:
          justify-content: '=props.compact ? "space-around" : "space-between"'
      slots:
        default:
          - component: f7-col
            config:
              width: 60
              style:
                padding: 10px
            slots:
              default:
                - component: oh-button
                  config:
                    text: '=(props.title ? (props.title) + ": " : "") + (items[props.item + "_Status"].state + ((items[props.item + "_Statusdetail"].state !== "none") ? (" " + items[props.item + "_Statusdetail"].state) : "")).toUpperCase()'
                    iconF7: chevron_compact_right
                    disabled: true
                    style:
                      opacity: 1 !important
                      --f7-button-text-color: var(--f7-text-color)
                      text-align: left
                      text-transform: initial
          - component: f7-col
            config:
              width: 30
              style:
                width: 135px !important
                min-width: 135px
                padding: 10px
                padding-right: 0
            slots:
              default:
                - component: oh-button
                  config:
                    style:
                      float: left
                      opacity: 1 !important
                      --f7-button-text-color: var(--f7-text-color)
                      margin-right: 0
                      padding-right: 0
                      border-right: 9
                    disabled: true
                    text: ""
                    iconF7: '=(items[props.item + "_Batterystatus"].state === "charging") ? "bolt" : (items[props.item + "_Batterystatus"].state === "charged") ? "bolt_fill" : "asd"'
                - component: oh-button
                  config:
                    style:
                      --f7-button-text-color: var(--f7-text-color)
                      padding-left: 0
                      margin-left: 0
                      border-left: 0
                      opacity: 1 !important
                    text: =(items[props.item + "_Batterylevel"].displayState)
                    disabled: true
                    iconF7: '=(parseInt(items[props.item + "_Batterylevel"].state) < 30) ? "battery_0" : (parseInt(items[props.item + "_Batterylevel"].state) < 70) ? "battery_25" : "battery_100"'
    - component: f7-row
      config:
        style:
          --f7-button-outline-border-color: var(--f7-text-color)
          --f7-button-text-color: var(--f7-text-color)
          display: '=(props.hide_attachments) ? "none" : "flex"'
          justify-content: center
          padding-bottom: 15px
      slots:
        default:
          - component: oh-button
            config:
              disabled: true
              text: "Dust bin"
              iconF7: tray
              outline: '=(items[props.item + "_Dustbin"]).state === "ON" ? true : false'
              style:
                opacity: .7 !important

          - component: oh-button
            config:
              disabled: true
              text: "Water tank"
              iconF7: drop
              outline: '=(items[props.item + "_Watertank"]).state === "ON" ? true : false'
              style:
                opacity: .7 !important

          - component: oh-button
            config:
              disabled: true
              text: "Mop"
              iconF7: drop_triangle
              outline: '=items[props.item + "_Mop"].state === "ON" ? true : false'
              style:
                opacity: .7 !important
    - component: f7-row
      config:
        style:
          justify-content: space-around
          padding-top: 5px
          border-top: '=themeOptions.dark === "dark" ? "solid 1px rgba(255, 255, 255, 0.2)" : "solid 1px rgba(0, 0, 0, 0.2)"'
      slots:
        default:
          - component: oh-button
            config:
              text: '=(items[props.item + "_Status"].state === "paused") ? "Resume" : (items[props.item + "_Status"].state === "cleaning") ? "Pause" : "Start"'
              iconF7: '=(items[props.item + "_Status"].state === "cleaning") ? "pause_fill" : "play_fill"'
              large: true
              active: =(items[props.item + "_Status"].state === "cleaning")
              action: command
              actionItem: =(props.item + "_Operation")
              actionCommand: '=(items[props.item + "_Status"].state === "cleaning") ? "PAUSE" : "START"'
              style:
                padding-left: 20px
                padding-right: 20px
          - component: oh-button
            config:
              text: Stop
              iconF7: '=(items[props.item + "_Status"].state === "docked" || items[props.item + "_Status"].state === "idle") ? "stop" : "stop_fill"'
              large: true
              action: command
              actionItem: =(props.item + "_Operation")
              actionCommand: STOP
              style:
                padding-left: 20px
                padding-right: 20px
          - component: oh-button
            config:
              text: '=(items[props.item + "_Status"].state === "docked") ? "Docked" : (items[props.item + "_Status"].state === "returning") ? "Returning" : "Dock"'
              iconF7: '=(items[props.item + "_Status"].state === "docked") ? "house_alt" : "house_alt_fill"'
              large: true
              active: =(items[props.item + "_Status"].state === "returning")
              action: command
              actionItem: =(props.item + "_Operation")
              actionCommand: HOME
              style:
                padding-left: 20px
                padding-right: 20px
          - component: oh-button
            config:
              text: Locate
              iconF7: placemark
              large: true
              action: command
              actionItem: =(props.item + "_Locate")
              actionCommand: PERFORM
              style:
                display: '=(props.hide_locate ? "none" : undefined)'
                padding-left: 20px
                padding-right: 20px
          - component: oh-button
            config:
              text: "Clean room"
              iconF7: viewfinder
              large: true
              action: options
              actionItem: '=props.item + "_Cleansegments"'
              actionOptions: =props.segments
              style:
                display: '=props.segments !== undefined ? undefined : "none"'
    - component: f7-row
      config:
        style:
          margin-top: 15px
          display: '=((items[props.item + "_Fanspeed"] !== undefined && !props.compact) ? undefined : "none")'
      slots:
        default:
          - component: f7-col
            config:
              width: 10
            slots:
              default:
                - component: f7-icon
                  config:
                    f7: wind
                    style:
                      padding-left: 15px
          - component: f7-col
            config:
              width: 90
              style:
                margin-bottom: 5px
            slots:
              default:
                - component: f7-segmented
                  slots:
                    default:
                      - component: oh-repeater
                        config:
                          for: item
                          sourceType: itemCommandOptions
                          itemOptions: =props.item + "_Fanspeed"
                          containerClass: row
                          fragment: true
                        slots:
                          default:
                            - component: oh-button
                              config:
                                text: =loop.item.label
                                small: true
                                action: command
                                actionItem: =props.item + "_Fanspeed"
                                actionCommand: =loop.item.command
                                active: =items[props.item + "_Fanspeed"].state === loop.item.command
    - component: f7-row
      config:
        style:
          display: '=((items[props.item + "_Watergrade"] !== undefined && !props.compact) ? undefined : "none")'
      slots:
        default:
          - component: f7-col
            config:
              width: 10
            slots:
              default:
                - component: f7-icon
                  config:
                    f7: drop
                    style:
                      padding-left: 15px
          - component: f7-col
            config:
              width: 90
              style:
                margin-bottom: 15px
            slots:
              default:
                - component: f7-segmented
                  slots:
                    default:
                      - component: oh-repeater
                        config:
                          for: item
                          sourceType: itemCommandOptions
                          itemOptions: =props.item + "_Watergrade"
                          containerClass: row
                          fragment: true
                        slots:
                          default:
                            - component: oh-button
                              config:
                                text: =loop.item.label
                                small: true
                                action: command
                                actionItem: =props.item + "_Watergrade"
                                actionCommand: =loop.item.command
                                active: =items[props.item + "_Watergrade"].state === loop.item.command
    - component: f7-row
      config:
        style:
          display: '=(props.compact) ? undefined : "none"'
          justify-content: space-around
      slots:
        default:
          - component: f7-col
            config:
              style:
                --f7-button-text-color: var(--f7-text-color)
                display: '=(items[props.item + "_Fanspeed"] !== undefined ? undefined : "none")'
              width: '=(items[props.item + "_Watergrade"] !== undefined ? 50 : 100)'
            slots:
              default:
                - component: oh-button
                  config:
                    text: '="Fan: " + items[props.item + "_Fanspeed"].state'
                    iconF7: wind
                    large: true
                    action: options
                    actionItem: =props.item + "_Fanspeed"
          - component: f7-col
            config:
              style:
                --f7-button-text-color: var(--f7-text-color)
                display: '=(items[props.item + "_Watergrade"] !== undefined ? undefined : "none")'
              width: '=(items[props.item + "_Fanspeed"] !== undefined ? 50 : 100)'
            slots:
              default:
                - component: oh-button
                  config:
                    text: '="Water: " + items[props.item + "_Watergrade"].state'
                    iconF7: drop
                    large: true
                    action: options
                    actionItem: =props.item + "_Watergrade"
   
    - component: f7-row
      config:
        style:
          display: '=((props.valetudo_url || props.floorplan || props.segments) ? undefined : "none")'
          justify-content: space-around
      slots:
        default:

          - component: f7-col
            config:
              style:
                --f7-button-text-color: var(--f7-text-color)
                display: '=(props.floorplan ? undefined : "none")'
              width: "=(props.valetudo_url) ? 50 : 100"
            slots:
              default:
                - component: oh-button
                  config:
                    text: Floor plan
                    iconF7: map
                    large: true
                    action: navigate
                    actionPage: =props.floorplan
          - component: f7-col
            config:
              style:
                --f7-button-text-color: var(--f7-text-color)
                display: '=(props.valetudo_url ? undefined : "none")'
              width: "=(props.floorplan ? 50 : 100)"
            slots:
              default:
                - component: oh-button
                  config:
                    text: Valetudo
                    iconF7: link
                    large: true
                    action: url
                    actionUrl: =props.valetudo_url
                    actionUrlSameWindow: false
                    
    - component: f7-row
      config:
        style:
          display: '=(props.map_url ? undefined : "none")'
      slots:
        default:
          - component: oh-image
            config:
              url: =props.map_url
              lazy: false
              style:
                width: 100%
                height: auto
    - component: f7-row
      config: {}
      slots:
        default:
          - component: oh-image
            config:
              url: =atob(items[props.item + "_Map"].state)
              lazy: false
              style:
                width: 100%
                height: auto
```