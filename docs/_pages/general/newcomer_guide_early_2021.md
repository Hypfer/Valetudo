---
title: Newcomer Guide Early 2021
category: Archive
order: 9999
---

# Valetudo Newcomer Guide Early 2021 Edition

Hi and welcome to the Valetudo Newcomer Guide Early 2021 Edition

This should hopefully answer all the questions you might have and also be interesting to read for people that haven't been following the recent development.

<div class="alert alert-note" role="alert">
  <p>
    <strong>Note:</strong><br/>
This guide has been archived and is only still here so that links don't break. You should
        <a href="https://valetudo.cloud/pages/general/newcomer_guide_late_2021.html">read the most recent one instead</a>.
  </p>

</div>



## What is Valetudo?

Valetudo is a cloud replacement for vacuum robots enabling local-only operation. It is not a custom firmware.
That means that it cannot change anything about how the robot operates.

What it can do however is protecting your data and enable you to connect your robot
to your home automation system without having to detour through a vendor cloud, which,
apart from the whole data problematic, might not be reachable due to your internet connection
being down or some servers in the datacenter being on fire.

Not having to leave your local network of course also benefits the latency of commands, status reports etc.

## What is the mission statement of Valetudo?

The Goal of Valetudo is to both remove cloud connectivity as well as provide an abstraction layer so that no matter
which robot you're using, with Valetudo on it, everything should be pretty much the same.

This of course also includes support for companion applications such as [Valeronoi](https://github.com/ccoors/Valeronoi),
which can build a wifi signal heatmap from the data provided by Valetudo.
Make sure to check that out.

## What can Valetudo do?

By default, Valetudo provides control over your Vacuum robot via a **REST-interface** as well as **MQTT**.
With support for both **Homie** and **Home Assistant Autodiscovery** for MQTT, you should be able to connect Valetudo to
the open-source smarthome software of your choice.

Make sure to check out the [MQTT Docs](https://valetudo.cloud/pages/integrations/mqtt.html) as well as the new
[OpenHAB integration](https://valetudo.cloud/pages/integrations/openhab-integration.html).

Valetudo fully supports:

- Room Cleaning, splitting, merging and renaming **new 2021**
- Water Pump controls and editing no-mop zones **new 2021**
- Editing Virtual Walls, No-Go Areas
- Dynamic zoned cleanup
- Go-To locations
- Start/Stop/Home/Locate and Fan speed control
- Consumables monitoring
- Carpet mode and persistent data control
- Audio volume control

as long as your robots firmware can actually do that.

You can find out what your Valetudo-enabled Robot is capable of by checking out the
[supported robots](https://valetudo.cloud/pages/general/supported-robots.html) docs section as well as the
[capabilities overview](https://valetudo.cloud/pages/general/capabilities-overview.html).

By replacing the cloud, you also gain access to your own data, which you can use however you like.

For example there are already a few applications that turn your map data into various other formats such as Minecraft Worlds
or Source-Engine maps. There's a huge amount of possibilities yet to be explored.

Due to the openly documented, standardized and easily accessible Map Data, one can use any Valetudo-compatible Vacuum Robot to map out
a new home, write some glue code to transform it into the 3d software of their choice and use that precise floorplan to
figure out where to put the furniture.

## Which robot should I buy in 2021 to use it with Valetudo?

You can buy any of the [supported robots](https://valetudo.cloud/pages/general/supported-robots.html) with
[public rooting instructions](https://dontvacuum.me/robotinfo/) available.

Unfortunately though, rooting roborock vacuum robots has become quite hard.
However, recently, support for the Vendor Dreame was added.

If you're looking for a similar experience to the Roborock S5 in 2018, you'll probably want to buy a Dreame.

The Dreame D9 for example features LIDAR-based SLAM and is fairly easy to root with no soldering required while also providing the same features
and more you'd've gotten with a Roborock S5 ~1 to 1.5 years ago.

On sale, people were able to buy it for 225€, which is insanely cheap for a lidar-based vacuum robot with room detection.

## How do I install Valetudo?

The [rooting instructions](https://valetudo.cloud/pages/general/rooting-instructions.html) page will point you to the
right guide for your robot. :)


## Where can I get support?

If you're looking for answers/supported, the first place to look are the docs but you know that since you're already here. If these don't contain the answers you're looking for but you actually know them, feel free to open a PR to enhance the docs :)

Furthermore, you can also check the [Telegram Group](https://t.me/joinchat/K75O8F3ccTBjYjli).
Telegram features a very powerful full-text search so make sure to use that before asking.

There's also the option of using the [Github Discussions feature](https://github.com/Hypfer/Valetudo/discussions/categories/q-a-support). The same "search before you ask" applies here.
If you experience issues, please don't immediately file a bug report but instead only do that if you're 100% sure that it is actually a bug.

In general and especially if you're new to open source, It's strongly recommended to thoroughly read and understand "[How To Ask Questions The Smart Way](http://www.catb.org/~esr/faqs/smart-questions)", since that will make interactions much better for everyone involved.

## How can I contribute to Valetudo?

### As a regular user

You don't need to be a developer to contribute to Valetudo, because the best way to support the project is to support other Valetudo users of which there are quite a few.

Just stick around in the Telegram Group, the IRC and/or the Github Discussions :)

### As a developer

If you're a developer, the usual stuff applies.
They may be Issues tagged with "Good First Issue" which should be the right place to start.

If you intend to open a PR, please make sure to make yourself familiar with the [PR Template](https://raw.githubusercontent.com/Hypfer/Valetudo/master/.github/PULL_REQUEST_TEMPLATE.md).

If you intend to add a new feature, you should expect the discussion thread to be open at least a few weeks until you can start working on that.
Please note that no response doesn't mean yes. PRs not following these rules will be closed without further discussion
