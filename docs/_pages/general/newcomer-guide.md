---
title: Newcomer Guide
category: General
order: 5
---

# Valetudo Newcomer Guide

Hi and welcome to the Valetudo Newcomer Guide.

_Last update: 2025-10-27_

## Table of Contents
1. [What is Valetudo?](#what_is_valetudo)
2. [Who is Valetudo for?](#who_is_valetudo_for)
3. [What can Valetudo do?](#what_can_valetudo_do)
4. [Which robot should I buy to use it with Valetudo?](#which_robot)
5. [How do I install Valetudo?](#how_to_install)
6. [Where can I get support?](#get_support)


## What is Valetudo?<a id='what_is_valetudo'></a>

Valetudo is a cloud replacement for vacuum robots enabling local-only operation. It is not a custom firmware.<br/>
Here's a diagram illustrating the core operation principle:

[<img src="./img/operation_principle.png" style="max-height: 450px;">](./img/operation_principle.png)

You can think of it as a (quoting a user) "brain parasite" for the vendor firmware.

This comes with pro's and con's, with the main pro being that we get to benefit from the hundreds of thousands of hours of
R&D the vendors put into their firmwares, but without the cloud and account requirements.

As such, it protects your data through not sharing it with anyone by being fully local, saves you from in-app ads, upselling, sudden subscriptions
and all the other fun enshittification tactics and playbooks.

Furthermore, Valetudo allows you to connect your robot to your home automation system without having to detour through a vendor cloud, which,
apart from the whole privacy topic, might not be reachable due to your internet connection being down or some servers in the datacenter being on fire.
Additionally, not having to leave your local network of course also benefits the latency of commands, status reports etc.

Valetudo aims to be proof that easy to use and reliable smart appliances are possible without any cloud and/or account requirements.

While being published under the Apache-2.0 license and clearly being FOSS, the governance and development model Valetudo operates under
is to be understood as that of "Freeware with source available". It is evidently much more than that when it comes to the freedoms provided by true FOSS,
but it is not the FOSS that only knows "community-driven" you might be used to from corporate co-option and come to expect when you read "FOSS".

If you want to learn more about why someone would want to use something like Valetudo, check out the [Why Valetudo?](https://valetudo.cloud/pages/general/why-valetudo.html) page.

If you want to learn more about why someone would **not** want to use something like Valetudo, check out the [Why not Valetudo?](https://valetudo.cloud/pages/general/why-not-valetudo.html) page.

## Who is Valetudo for?<a id='who_is_valetudo_for'></a>

Valetudo can be used by anyone with a basic understanding of the english language.

**Note:**<br/>
While Valetudo can be **used** by anyone with a basic understanding of the english language, it cannot be **installed**
just with those skills.

To install Valetudo you will need some understanding of linux-ish operating systems as well as computers in general
and maybe even some basic hardware hacking stuff.

This is in part because anything else wouldn't scale, but also, because Valetudo doesn't just aim to free your robot,
but, to some degree (and sounding like some weird guru) to "free yourself".
The idea here being that through this project (which is optional with no lives depending on it), one is confronted
with challenges that develop useful skills, eventually leading to less dependence on other parties, platforms etc.

Generally speaking, both I and also other users are happy to help, however, the help provided will be that of a peer.<br/>
Think of it as asking your neighbor for a pointer/hint on how he got his flowers to bloom this prettily vs ordering your neighbor
to make your flowers bloom this prettily or write you a step-by-step guide, because you're worried that you might harm the flowers.

The goal of Valetudo is to provide people not with **solutions** but with **agency**.

## What can Valetudo do?<a id='what_can_valetudo_do'></a>

Valetudo aims to be a generic abstraction, providing a responsive webinterface that allows control of the robot.
It can be used on phones, tablets as well as your desktop computer.

To integrate with other systems, it provides a REST-interface with inbuilt Swagger UI as documentation.
Additionally, it integrates with Home Assistant and other smarthome systems using MQTT.

Being a generic abstraction, Valetudo won't be a "feature-complete" reimplementation of the vendor apps, as that would also
mean inheriting all of their technical debt.
It does however support everything you need to have a proper, modern, cloud-free robot vacuum.

This includes:
- General controls like start/stop/home, fan speed, water, etc
- Live map views
- Room cleaning and management
- Virtual walls, No-Go and No-Mop zones
- Zoned cleanups
- Obstacle avoidance (including the camera-based ones)
- Various tunables exposed by the firmware


Additionally, since Valetudo takes all the proprietary vendor map data format and turns those into a unified ValetudoMap format,
independent of your model of robot, these maps can be used for various fun things.

For example there are already a few applications that turn your map data into various other formats such as [Minecraft Worlds
or Source-Engine maps](https://valetudo.cloud/pages/companion_apps/fun_games.html). Some people have also sent out their robot to map out a new living space before moving,
so that they could then use that as a base for 3d-modelling and planning.

Furthermore, the standardised Valetudo API allows for the creation of companion services such as [Valeronoi](https://github.com/ccoors/Valeronoi),
which can build a Wi-Fi signal heatmap from the data provided by Valetudo.


## Which robot should I buy to use it with Valetudo?<a id='which_robot'></a>

Valetudo "just works" because every robot it runs on has been bought and tested by myself.
This eliminates the common pain-points of somewhat similar FOSS projects, where you might end up buying something
"community supported" that turns out to actually not work at all.

In turn, it however also means that to use Valetudo, you will have to buy one of the supported robots.
This set is somewhat limited, but it is also limited to robots that are actually a good purchase, so no bad surprises there.

At the time of writing this, we are not lagging behind any major technological leaps. The supported robots include modern models
that can auto-empty, properly mop and avoid obstacles quite decently.
It is also worth noting that vacuum robots as a product category have now matured to the point where we're just seeing incremental refinements,
which, while definitely much appreciated, do not really warrant buying a new ~~computer~~ ~~smartphone~~ robot every year

To choose the right robot to buy, head over to [Buying supported robots](https://valetudo.cloud/pages/general/buying-supported-robots.html).


## How do I install Valetudo?<a id='how_to_install'></a>

The [getting started guide](https://valetudo.cloud/pages/general/getting-started.html) is a good place to start.

## Where can I get support?<a id='get_support'></a>

The answer to this depends on what you mean by support.

If you're looking for answers, the first place to look are the docs.<br/>
If you're stuck, I'm happy to help. As established in the "Who is Valetudo for?" section above, however, the help provided will be that of a peer.

The main channel for communication is the <a href="https://t.me/+F00lFE1NVUc2NTAy" data-si="34097f03527c7c0375540b07132a652161373b400c1039757e5c7a5e63536401556c2b1a2c41227d">Valetudo Telegram group</a>.
Telegram features a very powerful full-text search so make sure to use that before asking.

There's also the option of using the [GitHub Discussions feature](https://github.com/Hypfer/Valetudo/discussions/categories/q-a-support), however, most problems are actually best resolved
through a quick informal chat session instead of through a discussion post.

Any new knowledge or learnings gathered from those chats are picked up by me and woven into the docs and processes when necessary,
ensuring that nothing is being lost. No need to worry about that :)

