<div align="center">
    <img src="https://github.com/Hypfer/Valetudo/blob/master/assets/logo/valetudo_logo_with_name.svg" width="800" alt="valetudo">
    <p align="center"><h2>Free your vacuum from the cloud</h2></p>
</div>

[![Build Status](https://travis-ci.com/Hypfer/Valetudo.svg?branch=master)](https://travis-ci.com/Hypfer/Valetudo)

Valetudo is a standalone binary which runs on **rooted Vacuums of the Xiaomi ecosystem** and aims to enable the user to operate the robot vacuum without any Cloud Connection whatsoever.

Valetudo **provides (almost) all settings and controls** of the Xiaomi Vacuum in a **mobile-friendly webinterface** as well as optional **MQTT** Connectivity which supports **Home Assistant Autodiscovery**.

### Supported Hardware
Currently, there are two different families of supported robot vacuums

#### Roborock Vacuums
There are two supported Roborock vacuums:
* Gen 1 Xiaomi Mi SDJQR02RR aka Mi Robot Vacuum *rockrobo.vacuum.v1*
* Gen 2 Roborock S50/S51/S55 (depending on color) *roborock.vacuum.s5*

Everything else is unrootable (yet) and therefore not supported by Valetudo.<br/>
This includes the S6 as well as the S5 Max.

Please note that there's currently an unresolved problem with random firmware resets on roborock vacuums.<br/>
We're looking into it.

Furthermore, newer firmware versions such as 1910 for Gen 2 as well as 4004 for Gen 1 disabled local OTA Updates.<br/>
If you have these firmware versions installed, you will not be able to root the robot without factory-resetting it first.

#### Viomi Vacuums
Currently, there's WIP support for the following Viomi Vacuums:
* Xiaomi Mijia STYJ02YM *viomi.vacuum.v7*

See [here](./viomi_instructions.md) for more information on that.


### Getting started
For Roborock vacuums, just follow the [installation guide](https://hypfer.github.io/Valetudo/pages/installation/roborock.html).

The configuration file stored in `/mnt/data/valetudo/config.json` survives firmware upgrades.
The Valetudo binary however does not so if you are upgrading your firmware, you will have to follow said guide again.

Please don't forget to take a look at [the FAQ](https://hypfer.github.io/Valetudo/pages/faq.html) where you should find the answers to all of your questions.

### Screenshots:
![image](https://user-images.githubusercontent.com/974410/55658091-bc0f3880-57fc-11e9-8840-3e88186d5f56.png)
![image](https://user-images.githubusercontent.com/974410/55658093-be719280-57fc-11e9-97f2-e2a51120bace.png)
<details><summary>And even more screenshots</summary>
<p>
<img src="https://user-images.githubusercontent.com/974410/55658098-c16c8300-57fc-11e9-9a72-9d702be19482.png" />
<img src="https://user-images.githubusercontent.com/974410/55658101-c4677380-57fc-11e9-93dd-0551be98b047.png" />
<img src="https://user-images.githubusercontent.com/974410/55658077-abf75900-57fc-11e9-91c6-9f35f596f773.png" />
<img src="https://user-images.githubusercontent.com/974410/55658114-cd584500-57fc-11e9-9e01-1ff3c1bcde80.png" />
<img src="https://user-images.githubusercontent.com/974410/55658120-d47f5300-57fc-11e9-913c-10bc5f8288c4.png" />
<img src="https://user-images.githubusercontent.com/974410/55658162-fa0c5c80-57fc-11e9-93a0-e67e977c3151.png" />
<img src="https://user-images.githubusercontent.com/974410/55658169-009ad400-57fd-11e9-9955-856c75054da0.png" />
<img src="https://user-images.githubusercontent.com/974410/55658203-1a3c1b80-57fd-11e9-8fb2-25cfc1fad4a9.png" />
<img src="https://user-images.githubusercontent.com/974410/55658219-29bb6480-57fd-11e9-8a66-0d00739c9359.png" />
</p>
</details>

### Currently supported Features
This is an outdated list of Valetudo features on Rockrobo vacuums

* Live Map View
* Go-To
* Zoned Cleanup
* Configure Timers
* MQTT (including TLS support)
* MQTT HomeAssistant Autodiscovery
* Start/Stop/Pause Robot
* Find Robot/Send robot to charging dock
* Power settings
* Consumables status
* Wifi settings
* Carpet Mode
* Cleaning History
* Volume Control


### Join the Discussion
* #valetudo on irc.freenode.net
* [Valetudo Telegram group](https://t.me/joinchat/AR1z8xOGJQwkApTulyBx1w)

### Resources
* [I can't believe it's not Valetudo](https://github.com/Hypfer/ICantBelieveItsNotValetudo) - A companion service for PNG Maps
