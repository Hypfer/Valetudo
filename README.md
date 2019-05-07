<div align="center">
    <img src="https://github.com/Hypfer/Valetudo/blob/master/assets/logo/valetudo_logo_with_name.svg" width="800" alt="valetudo">
    <p align="center"><h2>Free your vacuum from the cloud</h2></p>
</div>

[![Build Status](https://travis-ci.com/Hypfer/Valetudo.svg?branch=master)](https://travis-ci.com/Hypfer/Valetudo)

Valetudo is a standalone binary which runs on **rooted Xiaomi Vacuums** and aims to enable the user to operate the robot vacuum without any Cloud Connection whatsoever.

Valetudo **provides (almost) all settings and controls** of the Xiaomi Vacuum in a **mobile-friendly webinterface** as well as optional **MQTT** Connectivity which supports **Home Assistant Autodiscovery**.

This Project is made possible by the work of many voluntary contributers. ❤

### Supported Hardware
As of now, only **Gen1 + Gen2 Xiaomi Vacuums** are rootable and hence supported by Valetudo.

### Getting started
Just follow the [installation guide in the wiki](https://github.com/Hypfer/Valetudo/wiki/Installation-Instructions).

The configuration file stored in `/mnt/data/valetudo/config.json` survives firmware upgrades.
The Valetudo binary however does not so if you are upgrading your firmware, you will have to follow said guide again.

Please don't forget to take a look at [the FAQ](https://github.com/Hypfer/Valetudo/wiki/FAQ) where you should find the answers to all of your questions.

### Currently supported Features
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

### Screenshots:
![image](https://user-images.githubusercontent.com/974410/55658091-bc0f3880-57fc-11e9-8840-3e88186d5f56.png)
![image](https://user-images.githubusercontent.com/974410/55658093-be719280-57fc-11e9-97f2-e2a51120bace.png)
![image](https://user-images.githubusercontent.com/974410/55658098-c16c8300-57fc-11e9-9a72-9d702be19482.png)
![image](https://user-images.githubusercontent.com/974410/55658101-c4677380-57fc-11e9-93dd-0551be98b047.png)
![image](https://user-images.githubusercontent.com/974410/55658077-abf75900-57fc-11e9-91c6-9f35f596f773.png)
![image](https://user-images.githubusercontent.com/974410/55658114-cd584500-57fc-11e9-9e01-1ff3c1bcde80.png)
![image](https://user-images.githubusercontent.com/974410/55658120-d47f5300-57fc-11e9-913c-10bc5f8288c4.png)
![image](https://user-images.githubusercontent.com/974410/55658162-fa0c5c80-57fc-11e9-93a0-e67e977c3151.png)
![image](https://user-images.githubusercontent.com/974410/55658169-009ad400-57fd-11e9-9955-856c75054da0.png)
![image](https://user-images.githubusercontent.com/974410/55658203-1a3c1b80-57fd-11e9-8fb2-25cfc1fad4a9.png)
![image](https://user-images.githubusercontent.com/974410/55658219-29bb6480-57fd-11e9-8a66-0d00739c9359.png)

### Join the Discussion
* #valetudo on irc.freenode.net
* [Valetudo Telegram group](https://t.me/joinchat/AR1z8xOGJQwkApTulyBx1w)

### Resources
* [I can't believe it's not Valetudo](https://github.com/Hypfer/ICantBelieveItsNotValetudo) - A companion service for PNG Maps
